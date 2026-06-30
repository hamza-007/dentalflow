// Package httpapi builds the chi router and wires middleware to handlers.
package httpapi

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"dentalflow/api/internal/auth"
	"dentalflow/api/internal/cases"
	"dentalflow/api/internal/config"
	"dentalflow/api/internal/fiche"
	"dentalflow/api/internal/files"
	"dentalflow/api/internal/http/handlers"
	"dentalflow/api/internal/kb"
	appmw "dentalflow/api/internal/http/middleware"
	"dentalflow/api/internal/messages"
	"dentalflow/api/internal/notifications"
)

// uploadsURLPrefix is where stored files are served from (outside /api/v1).
const uploadsURLPrefix = "/uploads"

// New constructs the API HTTP handler: middleware stack, dependency wiring, and
// the /api/v1 routes.
func New(logger *slog.Logger, pool *pgxpool.Pool, cfg config.Config) http.Handler {
	// --- repositories ---
	authRepo := auth.NewRepository(pool)
	caseRepo := cases.NewRepository(pool)
	filesRepo := files.NewRepository(pool)
	msgRepo := messages.NewRepository(pool)
	notifRepo := notifications.NewRepository(pool)

	// --- notifier fan-out (in-app live; email/SMS stubbed) ---
	notifier := notifications.NewMultiNotifier(
		notifications.NewInAppNotifier(notifRepo, logger),
		notifications.NewEmailNotifier(logger),
		notifications.NewSMSNotifier(logger),
	)

	// --- services ---
	tokens := auth.NewTokenManager(cfg.JWTAccessSecret, cfg.JWTRefreshSecret, cfg.JWTAccessTTL, cfg.JWTRefreshTTL)
	authSvc := auth.NewService(authRepo, tokens)
	caseSvc := cases.NewService(caseRepo, filesRepo, notifier) // filesRepo = DeliveryGuard
	msgSvc := messages.NewService(msgRepo, caseSvc, notifier)
	storage := files.NewLocalStorage(cfg.UploadDir, uploadsURLPrefix)
	fileSvc := files.NewService(filesRepo, storage, caseSvc)
	notifSvc := notifications.NewService(notifRepo)

	// Prosthesis Studio (V2): deterministic fiche assembly from the KB (no LLM,
	// no external calls).
	kbSvc := kb.NewService(kb.NewRepository(pool))
	ficheSvc := fiche.NewService(fiche.NewRepository(pool), kbSvc, caseSvc, logger)

	// --- handlers ---
	healthH := handlers.NewHealthHandler(pool)
	authH := handlers.NewAuthHandler(authSvc)
	caseH := handlers.NewCaseHandler(caseSvc)
	msgH := handlers.NewMessageHandler(msgSvc)
	fileH := handlers.NewFileHandler(fileSvc, cfg.MaxUploadSizeMB)
	notifH := handlers.NewNotificationHandler(notifSvc)
	ficheH := handlers.NewFicheHandler(ficheSvc)

	authenticate := appmw.Authenticator(tokens)

	// --- router ---
	r := chi.NewRouter()
	r.Use(appmw.RequestID)
	r.Use(appmw.Logger(logger))
	r.Use(appmw.Recoverer(logger))
	r.Use(appmw.CORS(cfg.CORSAllowedOrigins))

	// Static file server for uploaded files (dev).
	fileServer := http.FileServer(http.Dir(cfg.UploadDir))
	r.Handle(uploadsURLPrefix+"/*", http.StripPrefix(uploadsURLPrefix+"/", fileServer))

	r.Route("/api/v1", func(r chi.Router) {
		// Public.
		r.Get("/health", healthH.Health)
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authH.Register)
			r.Post("/login", authH.Login)
			r.Post("/refresh", authH.Refresh)
		})

		// Protected.
		r.Group(func(r chi.Router) {
			r.Use(authenticate)

			r.Get("/auth/me", authH.Me)
			r.Get("/labs", authH.ListLabs)

			r.Route("/notifications", func(r chi.Router) {
				r.Get("/", notifH.List)
				r.Get("/unread-count", notifH.UnreadCount)
				r.Post("/read-all", notifH.MarkAllRead)
				r.Post("/{id}/read", notifH.MarkRead)
			})

			r.Route("/cases", func(r chi.Router) {
				r.Get("/", caseH.List)
				r.Post("/", caseH.Create)

				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", caseH.Get)
					r.Delete("/", caseH.Delete)
					r.Patch("/status", caseH.UpdateStatus)
					r.Patch("/reception", caseH.Reception)
					r.Post("/return", caseH.Return)
					r.Post("/sign", caseH.Sign)
					r.Get("/history", caseH.History)
					r.Get("/returns", caseH.Returns)

					r.Get("/messages", msgH.List)
					r.Post("/messages", msgH.Create)

					r.Get("/files", fileH.List)
					r.Post("/files", fileH.Upload)
					r.Delete("/files/{file_id}", fileH.Delete)

					// Prosthesis Studio — fiche de fabrication.
					r.Post("/fiche", ficheH.Generate)
					r.Get("/fiche", ficheH.Latest)
					r.Get("/fiche/versions", ficheH.Versions)
				})
			})
		})
	})

	return r
}
