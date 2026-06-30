package files

import (
	"context"
	"io"
)

// CaseGuard authorizes access to a case's sub-resources (implemented by
// cases.Service).
type CaseGuard interface {
	IsParticipant(ctx context.Context, userID, caseID string) (bool, error)
}

// Service implements file use-cases: it stores bytes via Storage and metadata
// via the repository.
type Service struct {
	repo    *Repository
	storage Storage
	guard   CaseGuard
}

// NewService wires the files service.
func NewService(repo *Repository, storage Storage, guard CaseGuard) *Service {
	return &Service{repo: repo, storage: storage, guard: guard}
}

// List returns a case's files if the requester is a participant.
func (s *Service) List(ctx context.Context, userID, caseID string) ([]File, error) {
	if err := s.authorize(ctx, userID, caseID); err != nil {
		return nil, err
	}
	return s.repo.ListByCase(ctx, caseID)
}

// Upload stores the bytes and records the file (participant only).
func (s *Service) Upload(ctx context.Context, userID, caseID, fileName, fileType string, src io.Reader) (File, error) {
	if err := s.authorize(ctx, userID, caseID); err != nil {
		return File{}, err
	}
	if !IsValidType(fileType) {
		return File{}, ErrInvalidType
	}

	url, err := s.storage.Save(ctx, caseID, fileName, src)
	if err != nil {
		return File{}, err
	}

	return s.repo.Create(ctx, File{
		CaseID:     caseID,
		UploadedBy: userID,
		FileName:   fileName,
		FileURL:    url,
		FileType:   fileType,
	})
}

// Delete removes a file (uploader only) from storage and the DB.
func (s *Service) Delete(ctx context.Context, userID, caseID, fileID string) error {
	if err := s.authorize(ctx, userID, caseID); err != nil {
		return err
	}
	f, err := s.repo.GetByID(ctx, fileID)
	if err != nil {
		return err
	}
	if f.CaseID != caseID {
		return ErrNotFound
	}
	if f.UploadedBy != userID {
		return ErrForbidden
	}
	if err := s.repo.Delete(ctx, fileID); err != nil {
		return err
	}
	// Best-effort blob cleanup; the row is already gone.
	_ = s.storage.Delete(ctx, f.FileURL)
	return nil
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
