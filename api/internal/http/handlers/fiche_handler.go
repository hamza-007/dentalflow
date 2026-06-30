package handlers

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"dentalflow/api/internal/auth"
	"dentalflow/api/internal/cases"
	"dentalflow/api/internal/fiche"
	appmw "dentalflow/api/internal/http/middleware"
)

// FicheHandler exposes the Prosthesis Studio fiche endpoints.
type FicheHandler struct {
	service *fiche.Service
}

// NewFicheHandler wires the fiche handler.
func NewFicheHandler(service *fiche.Service) *FicheHandler {
	return &FicheHandler{service: service}
}

// Generate handles POST /cases/:id/fiche (lab only).
func (h *FicheHandler) Generate(w http.ResponseWriter, r *http.Request) {
	if appmw.Role(r.Context()) != auth.RoleLab {
		writeError(w, http.StatusForbidden, "forbidden", "only labs can generate a fiche")
		return
	}
	f, err := h.service.Generate(r.Context(), appmw.UserID(r.Context()), chi.URLParam(r, "id"))
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeData(w, http.StatusCreated, f)
}

// Latest handles GET /cases/:id/fiche.
func (h *FicheHandler) Latest(w http.ResponseWriter, r *http.Request) {
	f, err := h.service.Latest(r.Context(), appmw.UserID(r.Context()), chi.URLParam(r, "id"))
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeData(w, http.StatusOK, f)
}

// Versions handles GET /cases/:id/fiche/versions.
func (h *FicheHandler) Versions(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.Versions(r.Context(), appmw.UserID(r.Context()), chi.URLParam(r, "id"))
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeList(w, http.StatusOK, list, len(list))
}

func (h *FicheHandler) writeServiceError(w http.ResponseWriter, err error) {
	var guardErr *fiche.GuardrailError
	switch {
	case errors.As(err, &guardErr):
		// A numeric parameter was not cited — refuse to render (safety net).
		writeError(w, http.StatusUnprocessableEntity, "fiche_unverified", guardErr.Error())
	case errors.Is(err, fiche.ErrForbidden), errors.Is(err, cases.ErrForbidden):
		writeError(w, http.StatusForbidden, "forbidden", "not allowed")
	case errors.Is(err, fiche.ErrNotFound):
		writeError(w, http.StatusNotFound, "not_found", "no fiche for this case")
	case errors.Is(err, cases.ErrNotFound):
		writeError(w, http.StatusNotFound, "not_found", "case not found")
	default:
		writeError(w, http.StatusInternalServerError, "internal_error", "could not generate fiche")
	}
}
