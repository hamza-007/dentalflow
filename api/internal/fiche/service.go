package fiche

import (
	"context"
	"log/slog"

	"dentalflow/api/internal/cases"
	"dentalflow/api/internal/kb"
)

// CaseGetter fetches + authorizes a case (implemented by cases.Service).
type CaseGetter interface {
	Get(ctx context.Context, userID, caseID string) (cases.Case, error)
}

// KBRetriever returns grounding chunks for a material (implemented by kb.Service).
type KBRetriever interface {
	RetrieveByMaterial(ctx context.Context, material string, limit int) ([]kb.RetrievedChunk, error)
}

// Service orchestrates deterministic fiche generation: retrieve KB chunks →
// assemble → guardrail → persist. No LLM, no external calls.
type Service struct {
	repo   *Repository
	kb     KBRetriever
	cases  CaseGetter
	logger *slog.Logger
}

// NewService wires the fiche service.
func NewService(repo *Repository, retriever KBRetriever, caseGetter CaseGetter, logger *slog.Logger) *Service {
	return &Service{repo: repo, kb: retriever, cases: caseGetter, logger: logger}
}

// Generate builds and persists a fiche for a case (lab only).
func (s *Service) Generate(ctx context.Context, userID, caseID string) (Fiche, error) {
	c, err := s.cases.Get(ctx, userID, caseID) // participant authorization
	if err != nil {
		return Fiche{}, err
	}
	if c.LabID != userID {
		return Fiche{}, ErrForbidden
	}

	chunks, err := s.kb.RetrieveByMaterial(ctx, c.Material, 100)
	if err != nil {
		return Fiche{}, err
	}

	content := assemble(c, chunks)

	// Safety net: every numeric parameter must be cited. The assembler only ever
	// emits verbatim sourced chunks, so this passes — but we enforce it anyway.
	allowed := make(map[string]bool, len(chunks))
	for _, ch := range chunks {
		allowed[ch.SourceID] = true
	}
	if err := Check(content, allowed); err != nil {
		s.logger.ErrorContext(ctx, "fiche guardrail rejected deterministic content",
			slog.String("case_id", caseID), slog.Any("error", err))
		return Fiche{}, err // *GuardrailError
	}

	return s.repo.Create(ctx, caseID, content, toSources(chunks), userID)
}

// Latest returns the most recent fiche (participant only).
func (s *Service) Latest(ctx context.Context, userID, caseID string) (Fiche, error) {
	if _, err := s.cases.Get(ctx, userID, caseID); err != nil {
		return Fiche{}, err
	}
	return s.repo.Latest(ctx, caseID)
}

// Versions lists all fiches for a case (participant only).
func (s *Service) Versions(ctx context.Context, userID, caseID string) ([]Fiche, error) {
	if _, err := s.cases.Get(ctx, userID, caseID); err != nil {
		return nil, err
	}
	return s.repo.ListVersions(ctx, caseID)
}

func toSources(chunks []kb.RetrievedChunk) []Source {
	sources := make([]Source, 0, len(chunks))
	for _, ch := range chunks {
		sources = append(sources, Source{
			SourceID:     ch.SourceID,
			Title:        ch.Title,
			Manufacturer: ch.Manufacturer,
			Product:      ch.Product,
			Page:         ch.Page,
		})
	}
	return sources
}
