package messages

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository is the messages data-access layer.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository builds a messages repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ListByCase returns all messages for a case, oldest first.
func (r *Repository) ListByCase(ctx context.Context, caseID string) ([]Message, error) {
	const q = `
		SELECT m.id, m.case_id, m.sender_id, u.full_name, m.content, m.created_at
		FROM messages m
		JOIN users u ON u.id = m.sender_id
		WHERE m.case_id = $1
		ORDER BY m.created_at ASC`
	rows, err := r.pool.Query(ctx, q, caseID)
	if err != nil {
		return nil, fmt.Errorf("list messages: %w", err)
	}
	defer rows.Close()

	list := make([]Message, 0)
	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.CaseID, &m.SenderID, &m.SenderName, &m.Content, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan message: %w", err)
		}
		list = append(list, m)
	}
	return list, rows.Err()
}

// Create inserts a message and returns it (with sender name joined).
func (r *Repository) Create(ctx context.Context, caseID, senderID, content string) (Message, error) {
	const q = `
		WITH inserted AS (
			INSERT INTO messages (case_id, sender_id, content)
			VALUES ($1, $2, $3)
			RETURNING id, case_id, sender_id, content, created_at
		)
		SELECT i.id, i.case_id, i.sender_id, u.full_name, i.content, i.created_at
		FROM inserted i JOIN users u ON u.id = i.sender_id`
	var m Message
	err := r.pool.QueryRow(ctx, q, caseID, senderID, content).
		Scan(&m.ID, &m.CaseID, &m.SenderID, &m.SenderName, &m.Content, &m.CreatedAt)
	if err != nil {
		return Message{}, fmt.Errorf("create message: %w", err)
	}
	return m, nil
}
