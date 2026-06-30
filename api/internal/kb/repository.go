package kb

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository is the KB data-access layer.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository builds a KB repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// CreateDocument inserts a kb_documents row and returns its id.
func (r *Repository) CreateDocument(ctx context.Context, d Document) (string, error) {
	const q = `
		INSERT INTO kb_documents (title, manufacturer, product, material, source_url)
		VALUES ($1,$2,$3,$4,$5) RETURNING id`
	var id string
	err := r.pool.QueryRow(ctx, q, d.Title, d.Manufacturer, d.Product, d.Material, d.SourceURL).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("create kb document: %w", err)
	}
	return id, nil
}

// CreateChunk inserts a kb_chunks row. The embedding column is left NULL — the
// fiche is assembled deterministically, so no vector is needed.
func (r *Repository) CreateChunk(ctx context.Context, documentID string, in ChunkInput) error {
	const q = `
		INSERT INTO kb_chunks (document_id, content, parameter_type, page)
		VALUES ($1,$2,$3,$4)`
	_, err := r.pool.Exec(ctx, q, documentID, in.Content, in.ParameterType, in.Page)
	if err != nil {
		return fmt.Errorf("create kb chunk: %w", err)
	}
	return nil
}

// DeleteDocumentByTitle removes documents with the given title and their chunks.
// Used to make (re)seeding idempotent.
func (r *Repository) DeleteDocumentByTitle(ctx context.Context, title string) error {
	const delChunks = `DELETE FROM kb_chunks WHERE document_id IN (SELECT id FROM kb_documents WHERE title = $1)`
	const delDocs = `DELETE FROM kb_documents WHERE title = $1`
	if _, err := r.pool.Exec(ctx, delChunks, title); err != nil {
		return fmt.Errorf("delete kb chunks: %w", err)
	}
	if _, err := r.pool.Exec(ctx, delDocs, title); err != nil {
		return fmt.Errorf("delete kb document: %w", err)
	}
	return nil
}

// RetrieveByMaterial returns all chunks for a material (deterministic, ordered
// by parameter type then page), each with provenance for citation.
func (r *Repository) RetrieveByMaterial(ctx context.Context, material string, limit int) ([]RetrievedChunk, error) {
	const q = `
		SELECT c.id, c.content, c.parameter_type, COALESCE(c.page, 0),
		       d.title, d.manufacturer, d.product, d.material
		FROM kb_chunks c
		JOIN kb_documents d ON d.id = c.document_id
		WHERE ($1 = '' OR d.material ILIKE '%' || $1 || '%')
		ORDER BY c.parameter_type, c.page, c.created_at
		LIMIT $2`
	rows, err := r.pool.Query(ctx, q, material, limit)
	if err != nil {
		return nil, fmt.Errorf("retrieve kb chunks: %w", err)
	}
	defer rows.Close()

	out := make([]RetrievedChunk, 0)
	for rows.Next() {
		var c RetrievedChunk
		if err := rows.Scan(
			&c.SourceID, &c.Content, &c.ParameterType, &c.Page,
			&c.Title, &c.Manufacturer, &c.Product, &c.Material,
		); err != nil {
			return nil, fmt.Errorf("scan kb chunk: %w", err)
		}
		out = append(out, c)
	}
	return out, rows.Err()
}
