package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	appmw "dentalflow/api/internal/http/middleware"
	"dentalflow/api/internal/notifications"
)

// NotificationHandler exposes the notifications endpoints.
type NotificationHandler struct {
	service *notifications.Service
}

// NewNotificationHandler wires the notification handler.
func NewNotificationHandler(service *notifications.Service) *NotificationHandler {
	return &NotificationHandler{service: service}
}

// List handles GET /notifications.
func (h *NotificationHandler) List(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.List(r.Context(), appmw.UserID(r.Context()))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "could not list notifications")
		return
	}
	writeList(w, http.StatusOK, list, len(list))
}

// UnreadCount handles GET /notifications/unread-count.
func (h *NotificationHandler) UnreadCount(w http.ResponseWriter, r *http.Request) {
	n, err := h.service.UnreadCount(r.Context(), appmw.UserID(r.Context()))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "could not count notifications")
		return
	}
	writeData(w, http.StatusOK, map[string]int{"unread": n})
}

// MarkRead handles POST /notifications/{id}/read.
func (h *NotificationHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	if err := h.service.MarkRead(r.Context(), appmw.UserID(r.Context()), chi.URLParam(r, "id")); err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "could not update notification")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// MarkAllRead handles POST /notifications/read-all.
func (h *NotificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	if err := h.service.MarkAllRead(r.Context(), appmw.UserID(r.Context())); err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "could not update notifications")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
