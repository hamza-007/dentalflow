package notifications

import "context"

const defaultListLimit = 50

// Service exposes read/markRead operations for the notifications API.
type Service struct {
	repo *Repository
}

// NewService wires the notifications service.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// List returns the user's recent notifications.
func (s *Service) List(ctx context.Context, userID string) ([]Notification, error) {
	return s.repo.ListByUser(ctx, userID, defaultListLimit)
}

// UnreadCount returns the user's unread count.
func (s *Service) UnreadCount(ctx context.Context, userID string) (int, error) {
	return s.repo.UnreadCount(ctx, userID)
}

// MarkRead marks one notification read.
func (s *Service) MarkRead(ctx context.Context, userID, id string) error {
	return s.repo.MarkRead(ctx, userID, id)
}

// MarkAllRead marks all of the user's notifications read.
func (s *Service) MarkAllRead(ctx context.Context, userID string) error {
	return s.repo.MarkAllRead(ctx, userID)
}
