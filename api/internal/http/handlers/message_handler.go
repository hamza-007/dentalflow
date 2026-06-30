package handlers

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"dentalflow/api/internal/cases"
	appmw "dentalflow/api/internal/http/middleware"
	"dentalflow/api/internal/messages"
)

// MessageHandler exposes the per-case message endpoints.
type MessageHandler struct {
	service *messages.Service
}

// NewMessageHandler wires the message handler.
func NewMessageHandler(service *messages.Service) *MessageHandler {
	return &MessageHandler{service: service}
}

// List handles GET /cases/:id/messages.
func (h *MessageHandler) List(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")
	list, err := h.service.List(r.Context(), appmw.UserID(r.Context()), caseID)
	if err != nil {
		writeMessageError(w, err)
		return
	}
	writeList(w, http.StatusOK, list, len(list))
}

// Create handles POST /cases/:id/messages.
func (h *MessageHandler) Create(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")
	var in messages.CreateInput
	if err := decodeAndValidate(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	msg, err := h.service.Create(r.Context(), appmw.UserID(r.Context()), caseID, in.Content)
	if err != nil {
		writeMessageError(w, err)
		return
	}
	writeData(w, http.StatusCreated, msg)
}

func writeMessageError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, messages.ErrForbidden):
		writeError(w, http.StatusForbidden, "forbidden", "not a participant of this case")
	case errors.Is(err, cases.ErrNotFound):
		writeError(w, http.StatusNotFound, "not_found", "case not found")
	default:
		writeError(w, http.StatusInternalServerError, "internal_error", "something went wrong")
	}
}
