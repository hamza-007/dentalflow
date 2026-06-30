// Package cases owns dental case records, their status workflow, and history.
package cases

import (
	"context"
	"encoding/json"
	"errors"
	"time"
)

// Statuses (CLAUDE.md §6).
const (
	StatusNew         = "new"
	StatusAccepted    = "accepted"
	StatusDesigning   = "designing"
	StatusFabricating = "fabricating"
	StatusChecking    = "checking"
	StatusReady       = "ready"
	StatusDelivered   = "delivered"
	StatusRejected    = "rejected"
	StatusCorrection  = "correction"
)

// Priorities.
const (
	PriorityNormal = "normal"
	PriorityUrgent = "urgent"
)

// validTypes are the allowed prosthesis_type values (CLAUDE.md §6).
var validTypes = map[string]bool{
	"crown": true, "bridge": true, "inlay_onlay": true, "veneer": true,
	"partial_denture": true, "full_denture": true, "implant": true,
	"aligner": true, "temporary": true,
}

// allowedTransitions defines the status workflow. A move is legal only if the
// target appears in the source's list (CLAUDE.md §6).
var allowedTransitions = map[string][]string{
	StatusNew:         {StatusAccepted, StatusRejected},
	StatusAccepted:    {StatusDesigning},
	StatusDesigning:   {StatusFabricating},
	StatusFabricating: {StatusChecking},
	StatusChecking:    {StatusReady},
	StatusReady:       {StatusDelivered, StatusCorrection},
	StatusCorrection:  {StatusDesigning},
	StatusDelivered:   {}, // terminal
	StatusRejected:    {}, // terminal
}

// CanTransition reports whether from->to is a legal status change.
func CanTransition(from, to string) bool {
	for _, t := range allowedTransitions[from] {
		if t == to {
			return true
		}
	}
	return false
}

// validReturnReasons are the allowed structured return motifs (Problem #4).
var validReturnReasons = map[string]bool{
	"teinte": true, "forme": true, "occlusion": true, "marge": true,
	"contact": true, "axe": true, "surface": true, "autre": true,
}

// IsValidReturnReason reports whether r is an allowed return motif.
func IsValidReturnReason(r string) bool { return validReturnReasons[r] }

// Sentinel errors mapped to HTTP codes by the handler layer.
var (
	ErrNotFound          = errors.New("case not found")
	ErrForbidden         = errors.New("not allowed")
	ErrInvalidType       = errors.New("invalid prosthesis type")
	ErrInvalidDate       = errors.New("invalid due_date, expected YYYY-MM-DD")
	ErrInvalidStatus     = errors.New("invalid status transition")
	ErrNotDeletable      = errors.New("only new cases can be deleted")
	ErrFinalPhotoRequired = errors.New("a finished-prosthesis photo is required before delivery")
	ErrCannotReturn      = errors.New("this case cannot be returned")
	ErrInvalidReason     = errors.New("invalid return reason")
)

// DeliveryGuard checks delivery preconditions (e.g. a finished photo exists).
// Implemented by files.Repository to avoid an import cycle.
type DeliveryGuard interface {
	HasFinalPhoto(ctx context.Context, caseID string) (bool, error)
}

// Notifier emits a notification. Implemented by notifications.MultiNotifier;
// declared here so this package needs no import of notifications.
type Notifier interface {
	Notify(ctx context.Context, userID, caseID, ntype, message string)
}

// Case mirrors the cases table (CLAUDE.md §5).
type Case struct {
	ID             string          `json:"id"`
	DentistID      string          `json:"dentist_id"`
	LabID          string          `json:"lab_id"`
	PatientRef     string          `json:"patient_ref"`
	Teeth          []string        `json:"teeth"`
	ProsthesisType string          `json:"prosthesis_type"`
	Material       string          `json:"material"`
	Shade          *string         `json:"shade,omitempty"`
	Status         string          `json:"status"`
	Priority       string          `json:"priority"`
	DueDate        time.Time       `json:"due_date"`
	Notes          *string         `json:"notes,omitempty"`
	ExtraFields    json.RawMessage `json:"extra_fields,omitempty"`

	ReceptionChecklist json.RawMessage `json:"reception_checklist,omitempty"`
	ReceivedAt         *time.Time      `json:"received_at,omitempty"`
	DeliverySignature  *string         `json:"delivery_signature,omitempty"`
	SignedAt           *time.Time      `json:"signed_at,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CaseReturn mirrors a case_returns row (with the actor's name joined in).
type CaseReturn struct {
	ID           string    `json:"id"`
	CaseID       string    `json:"case_id"`
	ReturnedBy   string    `json:"returned_by"`
	ReturnedName string    `json:"returned_by_name,omitempty"`
	Reasons      []string  `json:"reasons"`
	Note         *string   `json:"note,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// ReturnInput is the POST /cases/:id/return body (dentist).
type ReturnInput struct {
	Reasons []string `json:"reasons" validate:"required,min=1,dive,required"`
	Note    *string  `json:"note"`
}

// ReceptionInput is the PATCH /cases/:id/reception body (lab).
type ReceptionInput struct {
	Checklist json.RawMessage `json:"checklist" validate:"required"`
}

// SignInput is the POST /cases/:id/sign body (dentist). Signature is a data URL.
type SignInput struct {
	Signature string `json:"signature" validate:"required"`
}

// StatusEvent mirrors a status_history row (with the actor's name joined in).
type StatusEvent struct {
	ID            string    `json:"id"`
	CaseID        string    `json:"case_id"`
	FromStatus    *string   `json:"from_status,omitempty"`
	ToStatus      string    `json:"to_status"`
	ChangedBy     string    `json:"changed_by"`
	ChangedByName string    `json:"changed_by_name,omitempty"`
	Note          *string   `json:"note,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// CreateInput is the POST /cases body (dentist supplies lab_id + clinical data).
type CreateInput struct {
	LabID          string          `json:"lab_id" validate:"required,uuid"`
	PatientRef     string          `json:"patient_ref" validate:"required"`
	Teeth          []string        `json:"teeth" validate:"required,min=1,dive,required"`
	ProsthesisType string          `json:"prosthesis_type" validate:"required"`
	Material       string          `json:"material" validate:"required"`
	Shade          *string         `json:"shade"`
	Priority       string          `json:"priority" validate:"omitempty,oneof=normal urgent"`
	DueDate        string          `json:"due_date" validate:"required"` // YYYY-MM-DD
	Notes          *string         `json:"notes"`
	ExtraFields    json.RawMessage `json:"extra_fields"`
}

// StatusInput is the PATCH /cases/:id/status body.
type StatusInput struct {
	Status string  `json:"status" validate:"required"`
	Note   *string `json:"note"`
}

// ListFilter scopes and filters a case list query.
type ListFilter struct {
	// Role scoping: exactly one of DentistID / LabID is set by the handler.
	DentistID string
	LabID     string

	Status     string
	Priority   string
	PatientRef string
	DueBefore  *time.Time
}
