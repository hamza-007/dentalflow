package cases

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository is the cases data-access layer. All SQL lives here (CLAUDE.md §8).
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository builds a cases repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

const caseColumns = `id, dentist_id, lab_id, patient_ref, teeth, prosthesis_type,
	material, shade, status, priority, due_date, notes, extra_fields,
	reception_checklist, received_at, delivery_signature, signed_at,
	created_at, updated_at`

// Create inserts a new case (status defaults to 'new') and returns it.
func (r *Repository) Create(ctx context.Context, c Case) (Case, error) {
	const q = `
		INSERT INTO cases
			(dentist_id, lab_id, patient_ref, teeth, prosthesis_type, material,
			 shade, priority, due_date, notes, extra_fields)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		RETURNING ` + caseColumns
	row := r.pool.QueryRow(ctx, q,
		c.DentistID, c.LabID, c.PatientRef, c.Teeth, c.ProsthesisType, c.Material,
		c.Shade, c.Priority, c.DueDate, c.Notes, c.ExtraFields,
	)
	return scanCase(row)
}

// GetByID returns a single case, or ErrNotFound.
func (r *Repository) GetByID(ctx context.Context, id string) (Case, error) {
	const q = `SELECT ` + caseColumns + ` FROM cases WHERE id = $1`
	c, err := scanCase(r.pool.QueryRow(ctx, q, id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Case{}, ErrNotFound
		}
		return Case{}, err
	}
	return c, nil
}

// List returns cases matching the filter, newest first.
func (r *Repository) List(ctx context.Context, f ListFilter) ([]Case, error) {
	var conds []string
	var args []any
	i := 1

	add := func(cond string, val any) {
		conds = append(conds, fmt.Sprintf(cond, i))
		args = append(args, val)
		i++
	}

	if f.DentistID != "" {
		add("dentist_id = $%d", f.DentistID)
	}
	if f.LabID != "" {
		add("lab_id = $%d", f.LabID)
	}
	if f.Status != "" {
		add("status = $%d", f.Status)
	}
	if f.Priority != "" {
		add("priority = $%d", f.Priority)
	}
	if f.PatientRef != "" {
		add("patient_ref = $%d", f.PatientRef)
	}
	if f.DueBefore != nil {
		add("due_date < $%d", *f.DueBefore)
	}

	q := `SELECT ` + caseColumns + ` FROM cases`
	if len(conds) > 0 {
		q += " WHERE " + strings.Join(conds, " AND ")
	}
	q += " ORDER BY created_at DESC"

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("list cases: %w", err)
	}
	defer rows.Close()

	list := make([]Case, 0)
	for rows.Next() {
		c, err := scanCase(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

// Delete removes a case by id.
func (r *Repository) Delete(ctx context.Context, id string) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM cases WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete case: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// UpdateStatus transactionally updates the case status and appends a
// status_history row.
func (r *Repository) UpdateStatus(ctx context.Context, caseID, from, to, changedBy string, note *string) (Case, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return Case{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck // no-op after commit

	const upd = `UPDATE cases SET status = $1, updated_at = now() WHERE id = $2 RETURNING ` + caseColumns
	updated, err := scanCase(tx.QueryRow(ctx, upd, to, caseID))
	if err != nil {
		return Case{}, fmt.Errorf("update status: %w", err)
	}

	const hist = `
		INSERT INTO status_history (case_id, from_status, to_status, changed_by, note)
		VALUES ($1,$2,$3,$4,$5)`
	if _, err := tx.Exec(ctx, hist, caseID, from, to, changedBy, note); err != nil {
		return Case{}, fmt.Errorf("insert status history: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return Case{}, fmt.Errorf("commit tx: %w", err)
	}
	return updated, nil
}

// ListHistory returns the status timeline for a case, oldest first, with the
// actor's full name joined in.
func (r *Repository) ListHistory(ctx context.Context, caseID string) ([]StatusEvent, error) {
	const q = `
		SELECT h.id, h.case_id, h.from_status, h.to_status, h.changed_by,
		       u.full_name, h.note, h.created_at
		FROM status_history h
		JOIN users u ON u.id = h.changed_by
		WHERE h.case_id = $1
		ORDER BY h.created_at ASC`
	rows, err := r.pool.Query(ctx, q, caseID)
	if err != nil {
		return nil, fmt.Errorf("list history: %w", err)
	}
	defer rows.Close()

	events := make([]StatusEvent, 0)
	for rows.Next() {
		var e StatusEvent
		if err := rows.Scan(&e.ID, &e.CaseID, &e.FromStatus, &e.ToStatus,
			&e.ChangedBy, &e.ChangedByName, &e.Note, &e.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan history: %w", err)
		}
		events = append(events, e)
	}
	return events, rows.Err()
}

// Return transactionally sets the case to 'correction', records a case_returns
// row with the structured motifs, and appends to status_history.
func (r *Repository) Return(ctx context.Context, caseID, from, returnedBy string, reasons []string, note *string) (Case, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return Case{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	const upd = `UPDATE cases SET status = $1, updated_at = now() WHERE id = $2 RETURNING ` + caseColumns
	updated, err := scanCase(tx.QueryRow(ctx, upd, StatusCorrection, caseID))
	if err != nil {
		return Case{}, fmt.Errorf("update status: %w", err)
	}

	if _, err := tx.Exec(ctx,
		`INSERT INTO case_returns (case_id, returned_by, reasons, note) VALUES ($1,$2,$3,$4)`,
		caseID, returnedBy, reasons, note); err != nil {
		return Case{}, fmt.Errorf("insert return: %w", err)
	}

	if _, err := tx.Exec(ctx,
		`INSERT INTO status_history (case_id, from_status, to_status, changed_by, note) VALUES ($1,$2,$3,$4,$5)`,
		caseID, from, StatusCorrection, returnedBy, note); err != nil {
		return Case{}, fmt.Errorf("insert status history: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return Case{}, fmt.Errorf("commit tx: %w", err)
	}
	return updated, nil
}

// ListReturns returns the structured return records for a case (newest first).
func (r *Repository) ListReturns(ctx context.Context, caseID string) ([]CaseReturn, error) {
	const q = `
		SELECT r.id, r.case_id, r.returned_by, u.full_name, r.reasons, r.note, r.created_at
		FROM case_returns r JOIN users u ON u.id = r.returned_by
		WHERE r.case_id = $1 ORDER BY r.created_at DESC`
	rows, err := r.pool.Query(ctx, q, caseID)
	if err != nil {
		return nil, fmt.Errorf("list returns: %w", err)
	}
	defer rows.Close()

	list := make([]CaseReturn, 0)
	for rows.Next() {
		var cr CaseReturn
		if err := rows.Scan(&cr.ID, &cr.CaseID, &cr.ReturnedBy, &cr.ReturnedName, &cr.Reasons, &cr.Note, &cr.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan return: %w", err)
		}
		list = append(list, cr)
	}
	return list, rows.Err()
}

// SetReception stores the lab's reception checklist and stamps received_at.
func (r *Repository) SetReception(ctx context.Context, caseID string, checklist []byte) (Case, error) {
	const q = `UPDATE cases SET reception_checklist = $1, received_at = now(), updated_at = now()
		WHERE id = $2 RETURNING ` + caseColumns
	return scanCase(r.pool.QueryRow(ctx, q, checklist, caseID))
}

// SetSignature stores the dentist's delivery signature and stamps signed_at.
func (r *Repository) SetSignature(ctx context.Context, caseID, signature string) (Case, error) {
	const q = `UPDATE cases SET delivery_signature = $1, signed_at = now(), updated_at = now()
		WHERE id = $2 RETURNING ` + caseColumns
	return scanCase(r.pool.QueryRow(ctx, q, signature, caseID))
}

// rowScanner is satisfied by both pgx.Row and pgx.Rows.
type rowScanner interface {
	Scan(dest ...any) error
}

func scanCase(row rowScanner) (Case, error) {
	var c Case
	err := row.Scan(
		&c.ID, &c.DentistID, &c.LabID, &c.PatientRef, &c.Teeth, &c.ProsthesisType,
		&c.Material, &c.Shade, &c.Status, &c.Priority, &c.DueDate, &c.Notes,
		&c.ExtraFields,
		&c.ReceptionChecklist, &c.ReceivedAt, &c.DeliverySignature, &c.SignedAt,
		&c.CreatedAt, &c.UpdatedAt,
	)
	return c, err
}
