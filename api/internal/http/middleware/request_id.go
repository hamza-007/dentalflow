// Package middleware holds the HTTP middleware stack for the API.
package middleware

import (
	"net/http"

	chimw "github.com/go-chi/chi/v5/middleware"
)

// RequestID assigns each request a unique ID, stored in the request context and
// echoed back in the X-Request-Id response header. Thin wrapper over chi's
// implementation so the rest of the stack can read it via chimw.GetReqID.
func RequestID(next http.Handler) http.Handler {
	return chimw.RequestID(next)
}
