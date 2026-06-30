package middleware

import (
	"context"
	"net/http"
	"strings"

	"dentalflow/api/internal/auth"
)

type ctxKey string

const (
	ctxUserID ctxKey = "user_id"
	ctxRole   ctxKey = "role"
)

// Authenticator validates the Bearer access token and stores the user ID + role
// in the request context. Requests without a valid token get 401.
func Authenticator(tm *auth.TokenManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			token, ok := bearer(header)
			if !ok {
				unauthorized(w)
				return
			}

			claims, err := tm.ParseAccess(token)
			if err != nil {
				unauthorized(w)
				return
			}

			ctx := context.WithValue(r.Context(), ctxUserID, claims.Subject)
			ctx = context.WithValue(ctx, ctxRole, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// UserID returns the authenticated user ID from the context (empty if absent).
func UserID(ctx context.Context) string {
	id, _ := ctx.Value(ctxUserID).(string)
	return id
}

// Role returns the authenticated user's role from the context (empty if absent).
func Role(ctx context.Context) string {
	role, _ := ctx.Value(ctxRole).(string)
	return role
}

func bearer(header string) (string, bool) {
	const prefix = "Bearer "
	if len(header) <= len(prefix) || !strings.EqualFold(header[:len(prefix)], prefix) {
		return "", false
	}
	token := strings.TrimSpace(header[len(prefix):])
	return token, token != ""
}

func unauthorized(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_, _ = w.Write([]byte(`{"error":{"code":"unauthorized","message":"authentication required"}}`))
}
