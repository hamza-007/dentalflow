// Package auth owns user identity: registration, login, JWT issuance, and the
// users repository.
package auth

import (
	"errors"
	"time"
)

// Roles.
const (
	RoleDentist = "dentist"
	RoleLab     = "lab"
)

// Sentinel errors, mapped to HTTP status codes by the handler layer.
var (
	ErrEmailExists        = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidToken       = errors.New("invalid or expired token")
)

// User mirrors the users table (CLAUDE.md §5). Password is never serialized.
type User struct {
	ID         string    `json:"id"`
	Email      string    `json:"email"`
	Password   string    `json:"-"`
	Role       string    `json:"role"`
	FullName   string    `json:"full_name"`
	ClinicName string    `json:"clinic_name"`
	Phone      *string   `json:"phone,omitempty"`
	City       *string   `json:"city,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

// Lab is the public projection used when a dentist picks a lab for a case.
type Lab struct {
	ID         string  `json:"id"`
	ClinicName string  `json:"clinic_name"`
	City       *string `json:"city,omitempty"`
}

// RegisterInput is the POST /auth/register body.
type RegisterInput struct {
	Email      string  `json:"email" validate:"required,email"`
	Password   string  `json:"password" validate:"required,min=8"`
	Role       string  `json:"role" validate:"required,oneof=dentist lab"`
	FullName   string  `json:"full_name" validate:"required"`
	ClinicName string  `json:"clinic_name" validate:"required"`
	Phone      *string `json:"phone"`
	City       *string `json:"city"`
}

// LoginInput is the POST /auth/login body.
type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// RefreshInput is the POST /auth/refresh body.
type RefreshInput struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// Tokens is the access + refresh pair returned on register/login/refresh.
type Tokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// AuthResult bundles the user with freshly issued tokens.
type AuthResult struct {
	User   User   `json:"user"`
	Tokens Tokens `json:"tokens"`
}
