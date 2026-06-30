package cases

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"dentalflow/api/internal/notifications"
)

// dateLayout is the expected due_date format (YYYY-MM-DD).
const dateLayout = "2006-01-02"

// Service implements case use-cases. It depends on the repository, a delivery
// guard (finished-photo check), and a notifier — never on pgx directly.
type Service struct {
	repo     *Repository
	delivery DeliveryGuard
	notifier Notifier
}

// NewService wires the cases service.
func NewService(repo *Repository, delivery DeliveryGuard, notifier Notifier) *Service {
	return &Service{repo: repo, delivery: delivery, notifier: notifier}
}

// Create validates input and creates a case owned by the given dentist.
func (s *Service) Create(ctx context.Context, dentistID string, in CreateInput) (Case, error) {
	if !validTypes[in.ProsthesisType] {
		return Case{}, ErrInvalidType
	}

	due, err := time.Parse(dateLayout, in.DueDate)
	if err != nil {
		return Case{}, ErrInvalidDate
	}

	priority := in.Priority
	if priority == "" {
		priority = PriorityNormal
	}

	extra := in.ExtraFields
	if len(extra) == 0 {
		extra = json.RawMessage(`{}`)
	}

	c := Case{
		DentistID:      dentistID,
		LabID:          in.LabID,
		PatientRef:     strings.TrimSpace(in.PatientRef),
		Teeth:          in.Teeth,
		ProsthesisType: in.ProsthesisType,
		Material:       strings.TrimSpace(in.Material),
		Shade:          in.Shade,
		Priority:       priority,
		DueDate:        due,
		Notes:          in.Notes,
		ExtraFields:    extra,
	}
	created, err := s.repo.Create(ctx, c)
	if err != nil {
		return Case{}, err
	}

	s.notify(ctx, created.LabID, created.ID, notifications.TypeCaseCreated,
		"Nouveau cas reçu : "+created.PatientRef)
	return created, nil
}

// Get returns a case if the requester is a participant.
func (s *Service) Get(ctx context.Context, userID, caseID string) (Case, error) {
	c, err := s.repo.GetByID(ctx, caseID)
	if err != nil {
		return Case{}, err
	}
	if c.DentistID != userID && c.LabID != userID {
		return Case{}, ErrForbidden
	}
	return c, nil
}

// List returns cases scoped to the requester's role (+ optional filters).
func (s *Service) List(ctx context.Context, userID, role string, in ListFilter) ([]Case, error) {
	switch role {
	case "dentist":
		in.DentistID = userID
	case "lab":
		in.LabID = userID
	default:
		return nil, ErrForbidden
	}
	return s.repo.List(ctx, in)
}

// Delete removes a case — only the owning dentist, and only while status=new.
func (s *Service) Delete(ctx context.Context, userID, caseID string) error {
	c, err := s.repo.GetByID(ctx, caseID)
	if err != nil {
		return err
	}
	if c.DentistID != userID {
		return ErrForbidden
	}
	if c.Status != StatusNew {
		return ErrNotDeletable
	}
	return s.repo.Delete(ctx, caseID)
}

// UpdateStatus moves a case forward (lab only), recording history. Delivery is
// gated on a finished-prosthesis photo existing.
func (s *Service) UpdateStatus(ctx context.Context, userID, caseID string, in StatusInput) (Case, error) {
	c, err := s.repo.GetByID(ctx, caseID)
	if err != nil {
		return Case{}, err
	}
	if c.LabID != userID {
		return Case{}, ErrForbidden
	}
	if !CanTransition(c.Status, in.Status) {
		return Case{}, ErrInvalidStatus
	}
	if in.Status == StatusDelivered && s.delivery != nil {
		ok, err := s.delivery.HasFinalPhoto(ctx, caseID)
		if err != nil {
			return Case{}, err
		}
		if !ok {
			return Case{}, ErrFinalPhotoRequired
		}
	}

	updated, err := s.repo.UpdateStatus(ctx, caseID, c.Status, in.Status, userID, in.Note)
	if err != nil {
		return Case{}, err
	}

	// Notify the dentist of the change.
	ntype := notifications.TypeStatusUpdated
	switch in.Status {
	case StatusAccepted:
		ntype = notifications.TypeCaseAccepted
	case StatusReady:
		ntype = notifications.TypeCaseReady
	}
	s.notify(ctx, updated.DentistID, updated.ID, ntype,
		"Statut mis à jour : "+updated.PatientRef+" → "+in.Status)
	return updated, nil
}

// Return sends a delivered/ready case back for correction (dentist only) with
// structured motifs.
func (s *Service) Return(ctx context.Context, userID, caseID string, in ReturnInput) (Case, error) {
	c, err := s.repo.GetByID(ctx, caseID)
	if err != nil {
		return Case{}, err
	}
	if c.DentistID != userID {
		return Case{}, ErrForbidden
	}
	if c.Status != StatusDelivered && c.Status != StatusReady {
		return Case{}, ErrCannotReturn
	}
	for _, r := range in.Reasons {
		if !IsValidReturnReason(r) {
			return Case{}, ErrInvalidReason
		}
	}

	updated, err := s.repo.Return(ctx, caseID, c.Status, userID, in.Reasons, in.Note)
	if err != nil {
		return Case{}, err
	}
	s.notify(ctx, updated.LabID, updated.ID, notifications.TypeCaseReturned,
		"Cas retourné pour correction : "+updated.PatientRef)
	return updated, nil
}

// SetReception stores the lab's reception checklist (lab only).
func (s *Service) SetReception(ctx context.Context, userID, caseID string, in ReceptionInput) (Case, error) {
	c, err := s.repo.GetByID(ctx, caseID)
	if err != nil {
		return Case{}, err
	}
	if c.LabID != userID {
		return Case{}, ErrForbidden
	}
	updated, err := s.repo.SetReception(ctx, caseID, in.Checklist)
	if err != nil {
		return Case{}, err
	}
	s.notify(ctx, updated.DentistID, updated.ID, notifications.TypeReception,
		"Réception confirmée : "+updated.PatientRef)
	return updated, nil
}

// Sign stores the dentist's delivery signature (dentist only, delivered cases).
func (s *Service) Sign(ctx context.Context, userID, caseID string, in SignInput) (Case, error) {
	c, err := s.repo.GetByID(ctx, caseID)
	if err != nil {
		return Case{}, err
	}
	if c.DentistID != userID {
		return Case{}, ErrForbidden
	}
	if c.Status != StatusDelivered {
		return Case{}, ErrInvalidStatus
	}
	return s.repo.SetSignature(ctx, caseID, in.Signature)
}

// History returns the status timeline if the requester is a participant.
func (s *Service) History(ctx context.Context, userID, caseID string) ([]StatusEvent, error) {
	if _, err := s.Get(ctx, userID, caseID); err != nil {
		return nil, err
	}
	return s.repo.ListHistory(ctx, caseID)
}

// Returns lists structured return records if the requester is a participant.
func (s *Service) Returns(ctx context.Context, userID, caseID string) ([]CaseReturn, error) {
	if _, err := s.Get(ctx, userID, caseID); err != nil {
		return nil, err
	}
	return s.repo.ListReturns(ctx, caseID)
}

// PatientHistory lists other cases sharing a patient_ref, scoped to the role.
func (s *Service) PatientHistory(ctx context.Context, userID, role, patientRef string) ([]Case, error) {
	return s.List(ctx, userID, role, ListFilter{PatientRef: patientRef})
}

// IsParticipant reports whether userID is the dentist or lab on the case.
func (s *Service) IsParticipant(ctx context.Context, userID, caseID string) (bool, error) {
	c, err := s.repo.GetByID(ctx, caseID)
	if err != nil {
		return false, err
	}
	return c.DentistID == userID || c.LabID == userID, nil
}

// Participants returns the dentist and lab IDs for a case (used to route
// message notifications to the other party).
func (s *Service) Participants(ctx context.Context, caseID string) (dentistID, labID string, err error) {
	c, err := s.repo.GetByID(ctx, caseID)
	if err != nil {
		return "", "", err
	}
	return c.DentistID, c.LabID, nil
}

func (s *Service) notify(ctx context.Context, userID, caseID, ntype, message string) {
	if s.notifier != nil {
		s.notifier.Notify(ctx, userID, caseID, ntype, message)
	}
}
