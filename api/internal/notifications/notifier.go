package notifications

import (
	"context"
	"log/slog"
)

// Notifier delivers a notification to a user over some channel. Producers
// (cases, messages) depend only on this interface — fire-and-forget, never
// failing the underlying operation.
type Notifier interface {
	Notify(ctx context.Context, userID, caseID, ntype, message string)
}

// InAppNotifier persists notifications to the database.
type InAppNotifier struct {
	repo   *Repository
	logger *slog.Logger
}

// NewInAppNotifier builds the live in-app notifier.
func NewInAppNotifier(repo *Repository, logger *slog.Logger) *InAppNotifier {
	return &InAppNotifier{repo: repo, logger: logger}
}

func (n *InAppNotifier) Notify(ctx context.Context, userID, caseID, ntype, message string) {
	if err := n.repo.Create(ctx, userID, caseID, ntype, message); err != nil {
		n.logger.ErrorContext(ctx, "in-app notify failed", slog.Any("error", err))
	}
}

// EmailNotifier is a stub: it logs instead of sending. Wire to SMTP later.
type EmailNotifier struct {
	logger *slog.Logger
}

// NewEmailNotifier builds the email stub.
func NewEmailNotifier(logger *slog.Logger) *EmailNotifier {
	return &EmailNotifier{logger: logger}
}

func (n *EmailNotifier) Notify(ctx context.Context, userID, caseID, ntype, message string) {
	n.logger.InfoContext(ctx, "email notification (stub)",
		slog.String("user_id", userID), slog.String("type", ntype), slog.String("message", message))
}

// SMSNotifier is a stub: it logs instead of sending. Wire to Twilio later.
type SMSNotifier struct {
	logger *slog.Logger
}

// NewSMSNotifier builds the SMS stub.
func NewSMSNotifier(logger *slog.Logger) *SMSNotifier {
	return &SMSNotifier{logger: logger}
}

func (n *SMSNotifier) Notify(ctx context.Context, userID, caseID, ntype, message string) {
	n.logger.InfoContext(ctx, "SMS notification (stub)",
		slog.String("user_id", userID), slog.String("type", ntype))
}

// MultiNotifier fans a notification out to several channels.
type MultiNotifier struct {
	notifiers []Notifier
}

// NewMultiNotifier composes channels.
func NewMultiNotifier(notifiers ...Notifier) *MultiNotifier {
	return &MultiNotifier{notifiers: notifiers}
}

func (m *MultiNotifier) Notify(ctx context.Context, userID, caseID, ntype, message string) {
	for _, n := range m.notifiers {
		n.Notify(ctx, userID, caseID, ntype, message)
	}
}
