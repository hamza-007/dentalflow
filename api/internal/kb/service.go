package kb

import "context"

// Service implements KB ingestion + deterministic retrieval.
type Service struct {
	repo *Repository
}

// NewService wires the KB service.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// Ingest stores a document and its chunks (used by cmd/seed-kb).
func (s *Service) Ingest(ctx context.Context, doc Document, chunks []ChunkInput) (int, error) {
	docID, err := s.repo.CreateDocument(ctx, doc)
	if err != nil {
		return 0, err
	}
	for _, ch := range chunks {
		if err := s.repo.CreateChunk(ctx, docID, ch); err != nil {
			return 0, err
		}
	}
	return len(chunks), nil
}

// Reseed replaces any existing document with the same title, then ingests —
// idempotent, so it's safe to re-run (e.g. self-seed on every boot).
func (s *Service) Reseed(ctx context.Context, doc Document, chunks []ChunkInput) (int, error) {
	if err := s.repo.DeleteDocumentByTitle(ctx, doc.Title); err != nil {
		return 0, err
	}
	return s.Ingest(ctx, doc, chunks)
}

// RetrieveByMaterial returns the chunks for a material with provenance.
func (s *Service) RetrieveByMaterial(ctx context.Context, material string, limit int) ([]RetrievedChunk, error) {
	return s.repo.RetrieveByMaterial(ctx, material, limit)
}
