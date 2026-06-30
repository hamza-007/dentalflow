package files

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository is the case_files data-access layer.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository builds a files repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

const fileColumns = `id, case_id, uploaded_by, file_name, file_url, file_type, created_at`

// Create inserts a file row and returns it.
func (r *Repository) Create(ctx context.Context, f File) (File, error) {
	const q = `
		INSERT INTO case_files (case_id, uploaded_by, file_name, file_url, file_type)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING ` + fileColumns
	err := r.pool.QueryRow(ctx, q, f.CaseID, f.UploadedBy, f.FileName, f.FileURL, f.FileType).
		Scan(&f.ID, &f.CaseID, &f.UploadedBy, &f.FileName, &f.FileURL, &f.FileType, &f.CreatedAt)
	if err != nil {
		return File{}, fmt.Errorf("create file: %w", err)
	}
	return f, nil
}

// ListByCase returns files for a case, newest first.
func (r *Repository) ListByCase(ctx context.Context, caseID string) ([]File, error) {
	const q = `SELECT ` + fileColumns + ` FROM case_files WHERE case_id = $1 ORDER BY created_at DESC`
	rows, err := r.pool.Query(ctx, q, caseID)
	if err != nil {
		return nil, fmt.Errorf("list files: %w", err)
	}
	defer rows.Close()

	list := make([]File, 0)
	for rows.Next() {
		var f File
		if err := rows.Scan(&f.ID, &f.CaseID, &f.UploadedBy, &f.FileName, &f.FileURL, &f.FileType, &f.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan file: %w", err)
		}
		list = append(list, f)
	}
	return list, rows.Err()
}

// GetByID returns one file, or ErrNotFound.
func (r *Repository) GetByID(ctx context.Context, id string) (File, error) {
	const q = `SELECT ` + fileColumns + ` FROM case_files WHERE id = $1`
	var f File
	err := r.pool.QueryRow(ctx, q, id).
		Scan(&f.ID, &f.CaseID, &f.UploadedBy, &f.FileName, &f.FileURL, &f.FileType, &f.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return File{}, ErrNotFound
		}
		return File{}, fmt.Errorf("get file: %w", err)
	}
	return f, nil
}

// HasFinalPhoto reports whether the case has at least one finished-prosthesis
// photo (file_type='final'). Used to gate delivery.
func (r *Repository) HasFinalPhoto(ctx context.Context, caseID string) (bool, error) {
	const q = `SELECT EXISTS(SELECT 1 FROM case_files WHERE case_id = $1 AND file_type = 'final')`
	var ok bool
	if err := r.pool.QueryRow(ctx, q, caseID).Scan(&ok); err != nil {
		return false, fmt.Errorf("check final photo: %w", err)
	}
	return ok, nil
}

// Delete removes a file row by id.
func (r *Repository) Delete(ctx context.Context, id string) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM case_files WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete file: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
