package auth

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// pgUniqueViolation is the SQLSTATE for a unique-constraint conflict.
const pgUniqueViolation = "23505"

// Repository is the users data-access layer. All SQL lives here (CLAUDE.md §8).
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository builds a users repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Create inserts a user and returns the stored row (with id + created_at).
func (r *Repository) Create(ctx context.Context, u User) (User, error) {
	const q = `
		INSERT INTO users (email, password, role, full_name, clinic_name, phone, city)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at`
	err := r.pool.QueryRow(ctx, q,
		u.Email, u.Password, u.Role, u.FullName, u.ClinicName, u.Phone, u.City,
	).Scan(&u.ID, &u.CreatedAt)
	if err != nil {
		if isUniqueViolation(err) {
			return User{}, ErrEmailExists
		}
		return User{}, fmt.Errorf("create user: %w", err)
	}
	return u, nil
}

// GetByEmail returns a user by email, or ErrUserNotFound.
func (r *Repository) GetByEmail(ctx context.Context, email string) (User, error) {
	const q = `
		SELECT id, email, password, role, full_name, clinic_name, phone, city, created_at
		FROM users WHERE email = $1`
	return r.scanOne(ctx, q, email)
}

// GetByID returns a user by id, or ErrUserNotFound.
func (r *Repository) GetByID(ctx context.Context, id string) (User, error) {
	const q = `
		SELECT id, email, password, role, full_name, clinic_name, phone, city, created_at
		FROM users WHERE id = $1`
	return r.scanOne(ctx, q, id)
}

// ListLabs returns the public projection of all lab users, ordered by name.
func (r *Repository) ListLabs(ctx context.Context) ([]Lab, error) {
	const q = `SELECT id, clinic_name, city FROM users WHERE role = $1 ORDER BY clinic_name`
	rows, err := r.pool.Query(ctx, q, RoleLab)
	if err != nil {
		return nil, fmt.Errorf("list labs: %w", err)
	}
	defer rows.Close()

	labs := make([]Lab, 0)
	for rows.Next() {
		var l Lab
		if err := rows.Scan(&l.ID, &l.ClinicName, &l.City); err != nil {
			return nil, fmt.Errorf("scan lab: %w", err)
		}
		labs = append(labs, l)
	}
	return labs, rows.Err()
}

func (r *Repository) scanOne(ctx context.Context, q string, arg any) (User, error) {
	var u User
	err := r.pool.QueryRow(ctx, q, arg).Scan(
		&u.ID, &u.Email, &u.Password, &u.Role,
		&u.FullName, &u.ClinicName, &u.Phone, &u.City, &u.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, ErrUserNotFound
		}
		return User{}, fmt.Errorf("get user: %w", err)
	}
	return u, nil
}

func isUniqueViolation(err error) bool {
	var pgErr interface{ SQLState() string }
	if errors.As(err, &pgErr) {
		return pgErr.SQLState() == pgUniqueViolation
	}
	return false
}
