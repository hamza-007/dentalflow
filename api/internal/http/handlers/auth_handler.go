package handlers

import (
	"errors"
	"net/http"

	"dentalflow/api/internal/auth"
	appmw "dentalflow/api/internal/http/middleware"
)

// AuthHandler exposes the authentication endpoints. Handlers stay thin: decode,
// validate, call the service, write the response (CLAUDE.md §8).
type AuthHandler struct {
	service *auth.Service
}

// NewAuthHandler wires the auth handler.
func NewAuthHandler(service *auth.Service) *AuthHandler {
	return &AuthHandler{service: service}
}

// Register handles POST /auth/register.
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var in auth.RegisterInput
	if err := decodeAndValidate(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	result, err := h.service.Register(r.Context(), in)
	if err != nil {
		if errors.Is(err, auth.ErrEmailExists) {
			writeError(w, http.StatusConflict, "email_exists", "email already registered")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal_error", "could not register")
		return
	}

	writeData(w, http.StatusCreated, result)
}

// Login handles POST /auth/login.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var in auth.LoginInput
	if err := decodeAndValidate(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	result, err := h.service.Login(r.Context(), in)
	if err != nil {
		if errors.Is(err, auth.ErrInvalidCredentials) {
			writeError(w, http.StatusUnauthorized, "invalid_credentials", "invalid email or password")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal_error", "could not log in")
		return
	}

	writeData(w, http.StatusOK, result)
}

// Refresh handles POST /auth/refresh.
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var in auth.RefreshInput
	if err := decodeAndValidate(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	result, err := h.service.Refresh(r.Context(), in.RefreshToken)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid_token", "invalid or expired refresh token")
		return
	}

	writeData(w, http.StatusOK, result.Tokens)
}

// Me handles GET /auth/me.
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := appmw.UserID(r.Context())
	user, err := h.service.Me(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "not_found", "user not found")
		return
	}
	writeData(w, http.StatusOK, user)
}

// ListLabs handles GET /labs (used by dentists to pick a lab for a case).
func (h *AuthHandler) ListLabs(w http.ResponseWriter, r *http.Request) {
	labs, err := h.service.ListLabs(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "could not list labs")
		return
	}
	writeList(w, http.StatusOK, labs, len(labs))
}
