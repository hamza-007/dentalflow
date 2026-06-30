// Package messages owns per-case threaded messages.
package messages

import (
	"errors"
	"time"
)

// ErrForbidden is returned when a non-participant accesses a case thread.
var ErrForbidden = errors.New("not a participant of this case")

// Message mirrors the messages table, with the sender's name joined in.
type Message struct {
	ID         string    `json:"id"`
	CaseID     string    `json:"case_id"`
	SenderID   string    `json:"sender_id"`
	SenderName string    `json:"sender_name"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
}

// CreateInput is the POST /cases/:id/messages body.
type CreateInput struct {
	Content string `json:"content" validate:"required,max=4000"`
}
