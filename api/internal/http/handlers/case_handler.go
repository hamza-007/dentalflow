package handlers

import (
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"dentalflow/api/internal/auth"
	"dentalflow/api/internal/cases"
	appmw "dentalflow/api/internal/http/middleware"
)

const dateLayout = "2006-01-02"

// CaseHandler exposes the case endpoints.
type CaseHandler struct {
	service *cases.Service
}

// NewCaseHandler wires the case handler.
func NewCaseHandler(service *cases.Service) *CaseHandler {
	return &CaseHandler{service: service}
}

// Create handles POST /cases (dentist only).
func (h *CaseHandler) Create(w http.ResponseWriter, r *http.Request) {
	if appmw.Role(r.Context()) != auth.RoleDentist {
		writeError(w, http.StatusForbidden, "forbidden", "only dentists can create cases")
		return
	}

	var in cases.CreateInput
	if err := decodeAndValidate(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	created, err := h.service.Create(r.Context(), appmw.UserID(r.Context()), in)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeData(w, http.StatusCreated, created)
}

// List handles GET /cases (role-scoped) with optional filters.
func (h *CaseHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := cases.ListFilter{
		Status:     r.URL.Query().Get("status"),
		Priority:   r.URL.Query().Get("priority"),
		PatientRef: r.URL.Query().Get("patient_ref"),
	}

	if raw := r.URL.Query().Get("due_before"); raw != "" {
		t, err := time.Parse(dateLayout, raw)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", "due_before must be YYYY-MM-DD")
			return
		}
		filter.DueBefore = &t
	}

	list, err := h.service.List(r.Context(), appmw.UserID(r.Context()), appmw.Role(r.Context()), filter)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeList(w, http.StatusOK, list, len(list))
}

// Get handles GET /cases/:id.
func (h *CaseHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	c, err := h.service.Get(r.Context(), appmw.UserID(r.Context()), id)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeData(w, http.StatusOK, c)
}

// Delete handles DELETE /cases/:id (dentist owner, only when status=new).
func (h *CaseHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.service.Delete(r.Context(), appmw.UserID(r.Context()), id); err != nil {
		h.writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// UpdateStatus handles PATCH /cases/:id/status (lab only).
func (h *CaseHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in cases.StatusInput
	if err := decodeAndValidate(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	updated, err := h.service.UpdateStatus(r.Context(), appmw.UserID(r.Context()), id, in)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeData(w, http.StatusOK, updated)
}

// Return handles POST /cases/:id/return (dentist only).
func (h *CaseHandler) Return(w http.ResponseWriter, r *http.Request) {
	if appmw.Role(r.Context()) != auth.RoleDentist {
		writeError(w, http.StatusForbidden, "forbidden", "only dentists can return cases")
		return
	}
	id := chi.URLParam(r, "id")
	var in cases.ReturnInput
	if err := decodeAndValidate(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	updated, err := h.service.Return(r.Context(), appmw.UserID(r.Context()), id, in)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeData(w, http.StatusOK, updated)
}

// Reception handles PATCH /cases/:id/reception (lab only).
func (h *CaseHandler) Reception(w http.ResponseWriter, r *http.Request) {
	if appmw.Role(r.Context()) != auth.RoleLab {
		writeError(w, http.StatusForbidden, "forbidden", "only labs can confirm reception")
		return
	}
	id := chi.URLParam(r, "id")
	var in cases.ReceptionInput
	if err := decodeAndValidate(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	updated, err := h.service.SetReception(r.Context(), appmw.UserID(r.Context()), id, in)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeData(w, http.StatusOK, updated)
}

// Sign handles POST /cases/:id/sign (dentist only, delivered cases).
func (h *CaseHandler) Sign(w http.ResponseWriter, r *http.Request) {
	if appmw.Role(r.Context()) != auth.RoleDentist {
		writeError(w, http.StatusForbidden, "forbidden", "only dentists can sign")
		return
	}
	id := chi.URLParam(r, "id")
	var in cases.SignInput
	if err := decodeAndValidate(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	updated, err := h.service.Sign(r.Context(), appmw.UserID(r.Context()), id, in)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeData(w, http.StatusOK, updated)
}

// Returns handles GET /cases/:id/returns.
func (h *CaseHandler) Returns(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	list, err := h.service.Returns(r.Context(), appmw.UserID(r.Context()), id)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeList(w, http.StatusOK, list, len(list))
}

// History handles GET /cases/:id/history.
func (h *CaseHandler) History(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	events, err := h.service.History(r.Context(), appmw.UserID(r.Context()), id)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeList(w, http.StatusOK, events, len(events))
}

// writeServiceError maps domain errors to the standard error envelope.
func (h *CaseHandler) writeServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, cases.ErrNotFound):
		writeError(w, http.StatusNotFound, "not_found", "case not found")
	case errors.Is(err, cases.ErrForbidden):
		writeError(w, http.StatusForbidden, "forbidden", "not allowed")
	case errors.Is(err, cases.ErrInvalidType):
		writeError(w, http.StatusBadRequest, "invalid_type", "invalid prosthesis type")
	case errors.Is(err, cases.ErrInvalidDate):
		writeError(w, http.StatusBadRequest, "invalid_date", "due_date must be YYYY-MM-DD")
	case errors.Is(err, cases.ErrInvalidStatus):
		writeError(w, http.StatusConflict, "invalid_status", "invalid status transition")
	case errors.Is(err, cases.ErrNotDeletable):
		writeError(w, http.StatusConflict, "not_deletable", "only new cases can be deleted")
	case errors.Is(err, cases.ErrFinalPhotoRequired):
		writeError(w, http.StatusConflict, "final_photo_required", "add a finished-prosthesis photo before delivering")
	case errors.Is(err, cases.ErrCannotReturn):
		writeError(w, http.StatusConflict, "cannot_return", "this case cannot be returned")
	case errors.Is(err, cases.ErrInvalidReason):
		writeError(w, http.StatusBadRequest, "invalid_reason", "invalid return reason")
	default:
		writeError(w, http.StatusInternalServerError, "internal_error", "something went wrong")
	}
}
