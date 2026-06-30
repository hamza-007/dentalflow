package handlers

import (
	"context"
	"net/http"
)

// Pinger is the minimal database dependency the health check needs.
// *pgxpool.Pool satisfies it.
type Pinger interface {
	Ping(ctx context.Context) error
}

// HealthHandler reports service and database liveness.
type HealthHandler struct {
	db Pinger
}

// NewHealthHandler wires the health check to its database dependency.
func NewHealthHandler(db Pinger) *HealthHandler {
	return &HealthHandler{db: db}
}

// Health responds with {"status":"ok","db":"ok"} when the DB ping succeeds, and
// 503 with {"status":"ok","db":"error"} when it does not.
func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	resp := map[string]string{"status": "ok", "db": "ok"}
	status := http.StatusOK

	if err := h.db.Ping(r.Context()); err != nil {
		resp["db"] = "error"
		status = http.StatusServiceUnavailable
	}

	writeJSON(w, status, resp)
}
