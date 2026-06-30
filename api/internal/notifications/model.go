// Package notifications owns in-app notifications and the Notifier fan-out
// (in-app live; email/SMS stubbed behind the same interface).
package notifications

import "time"

// Notification types.
const (
	TypeCaseCreated    = "case_created"
	TypeCaseAccepted   = "case_accepted"
	TypeStatusUpdated  = "status_updated"
	TypeCaseReady      = "case_ready"
	TypeNewMessage     = "new_message"
	TypeCaseReturned   = "case_returned"
	TypeReception      = "reception_confirmed"
)

// Notification mirrors the notifications table.
type Notification struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	CaseID    *string   `json:"case_id,omitempty"`
	Type      string    `json:"type"`
	Message   string    `json:"message"`
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"created_at"`
}
