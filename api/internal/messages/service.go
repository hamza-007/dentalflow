package messages

import (
	"context"

	"dentalflow/api/internal/notifications"
)

// CaseGuard authorizes access to a case and exposes its participants.
// Implemented by cases.Service (avoids an import cycle).
type CaseGuard interface {
	IsParticipant(ctx context.Context, userID, caseID string) (bool, error)
	Participants(ctx context.Context, caseID string) (dentistID, labID string, err error)
}

// Notifier emits a notification (implemented by notifications.MultiNotifier).
type Notifier interface {
	Notify(ctx context.Context, userID, caseID, ntype, message string)
}

// Service implements message use-cases.
type Service struct {
	repo     *Repository
	guard    CaseGuard
	notifier Notifier
}

// NewService wires the messages service.
func NewService(repo *Repository, guard CaseGuard, notifier Notifier) *Service {
	return &Service{repo: repo, guard: guard, notifier: notifier}
}

// List returns the thread for a case if the requester is a participant.
func (s *Service) List(ctx context.Context, userID, caseID string) ([]Message, error) {
	if err := s.authorize(ctx, userID, caseID); err != nil {
		return nil, err
	}
	return s.repo.ListByCase(ctx, caseID)
}

// Create posts a message (participant only) and notifies the other party.
func (s *Service) Create(ctx context.Context, userID, caseID, content string) (Message, error) {
	if err := s.authorize(ctx, userID, caseID); err != nil {
		return Message{}, err
	}
	msg, err := s.repo.Create(ctx, caseID, userID, content)
	if err != nil {
		return Message{}, err
	}

	if s.notifier != nil {
		if dentistID, labID, err := s.guard.Participants(ctx, caseID); err == nil {
			recipient := dentistID
			if userID == dentistID {
				recipient = labID
			}
			s.notifier.Notify(ctx, recipient, caseID, notifications.TypeNewMessage,
				"Nouveau message de "+msg.SenderName)
		}
	}
	return msg, nil
}

func (s *Service) authorize(ctx context.Context, userID, caseID string) error {
	ok, err := s.guard.IsParticipant(ctx, userID, caseID)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	return nil
}
