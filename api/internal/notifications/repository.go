package notifications

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository is the notifications data-access layer.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository builds a notifications repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Create inserts a notification. caseID may be empty (stored as NULL).
func (r *Repository) Create(ctx context.Context, userID, caseID, ntype, message string) error {
	const q = `INSERT INTO notifications (user_id, case_id, type, message) VALUES ($1, $2, $3, $4)`
	var casePtr *string
	if caseID != "" {
		casePtr = &caseID
	}
	_, err := r.pool.Exec(ctx, q, userID, casePtr, ntype, message)
	if err != nil {
		return fmt.Errorf("create notification: %w", err)
	}
	return nil
}

// ListByUser returns a user's notifications, newest first (capped).
func (r *Repository) ListByUser(ctx context.Context, userID string, limit int) ([]Notification, error) {
	const q = `
		SELECT id, user_id, case_id, type, message, read, created_at
		FROM notifications WHERE user_id = $1
		ORDER BY created_at DESC LIMIT $2`
	rows, err := r.pool.Query(ctx, q, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("list notifications: %w", err)
	}
	defer rows.Close()

	list := make([]Notification, 0)
	for rows.Next() {
		var n Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.CaseID, &n.Type, &n.Message, &n.Read, &n.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan notification: %w", err)
		}
		list = append(list, n)
	}
	return list, rows.Err()
}

// UnreadCount returns the number of unread notifications for a user.
func (r *Repository) UnreadCount(ctx context.Context, userID string) (int, error) {
	const q = `SELECT count(*) FROM notifications WHERE user_id = $1 AND read = false`
	var n int
	if err := r.pool.QueryRow(ctx, q, userID).Scan(&n); err != nil {
		return 0, fmt.Errorf("unread count: %w", err)
	}
	return n, nil
}

// MarkRead marks one notification read (scoped to the owner).
func (r *Repository) MarkRead(ctx context.Context, userID, id string) error {
	const q = `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`
	_, err := r.pool.Exec(ctx, q, id, userID)
	return err
}

// MarkAllRead marks all of a user's notifications read.
func (r *Repository) MarkAllRead(ctx context.Context, userID string) error {
	const q = `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`
	_, err := r.pool.Exec(ctx, q, userID)
	return err
}
