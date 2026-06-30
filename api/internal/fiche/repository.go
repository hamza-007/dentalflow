package fiche

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository persists fiches.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository builds a fiche repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Create inserts a new fiche at the next version for the case.
func (r *Repository) Create(ctx context.Context, caseID string, content Content, sources []Source, createdBy string) (Fiche, error) {
	contentJSON, err := json.Marshal(content)
	if err != nil {
		return Fiche{}, err
	}
	sourcesJSON, err := json.Marshal(sources)
	if err != nil {
		return Fiche{}, err
	}

	const q = `
		INSERT INTO fiches (case_id, version, content, sources, created_by)
		VALUES (
			$1,
			(SELECT COALESCE(MAX(version), 0) + 1 FROM fiches WHERE case_id = $1),
			$2::jsonb, $3::jsonb, $4
		)
		RETURNING id, case_id, version, created_by, created_at`
	var f Fiche
	err = r.pool.QueryRow(ctx, q, caseID, string(contentJSON), string(sourcesJSON), createdBy).
		Scan(&f.ID, &f.CaseID, &f.Version, &f.CreatedBy, &f.CreatedAt)
	if err != nil {
		return Fiche{}, fmt.Errorf("create fiche: %w", err)
	}
	f.Content = content
	f.Sources = sources
	return f, nil
}

// Latest returns the highest-version fiche for a case, or ErrNotFound.
func (r *Repository) Latest(ctx context.Context, caseID string) (Fiche, error) {
	const q = `
		SELECT id, case_id, version, content, sources, created_by, created_at
		FROM fiches WHERE case_id = $1 ORDER BY version DESC LIMIT 1`
	return scanFiche(r.pool.QueryRow(ctx, q, caseID))
}

// ListVersions returns all fiches for a case, newest first.
func (r *Repository) ListVersions(ctx context.Context, caseID string) ([]Fiche, error) {
	const q = `
		SELECT id, case_id, version, content, sources, created_by, created_at
		FROM fiches WHERE case_id = $1 ORDER BY version DESC`
	rows, err := r.pool.Query(ctx, q, caseID)
	if err != nil {
		return nil, fmt.Errorf("list fiches: %w", err)
	}
	defer rows.Close()

	list := make([]Fiche, 0)
	for rows.Next() {
		f, err := scanFicheRows(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, f)
	}
	return list, rows.Err()
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanFiche(row rowScanner) (Fiche, error) {
	f, err := scanFicheRows(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return Fiche{}, ErrNotFound
	}
	return f, err
}

func scanFicheRows(row rowScanner) (Fiche, error) {
	var f Fiche
	var contentRaw, sourcesRaw []byte
	if err := row.Scan(&f.ID, &f.CaseID, &f.Version, &contentRaw, &sourcesRaw, &f.CreatedBy, &f.CreatedAt); err != nil {
		return Fiche{}, err
	}
	if len(contentRaw) > 0 {
		if err := json.Unmarshal(contentRaw, &f.Content); err != nil {
			return Fiche{}, fmt.Errorf("unmarshal content: %w", err)
		}
	}
	if len(sourcesRaw) > 0 {
		_ = json.Unmarshal(sourcesRaw, &f.Sources)
	}
	return f, nil
}
