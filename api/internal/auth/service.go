package auth

import (
	"context"
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// Service implements the auth use-cases. It depends on the repository and the
// token manager — never on pgx directly (CLAUDE.md §8).
type Service struct {
	repo   *Repository
	tokens *TokenManager
}

// NewService wires the auth service.
func NewService(repo *Repository, tokens *TokenManager) *Service {
	return &Service{repo: repo, tokens: tokens}
}

// Register hashes the password, creates the user, and issues tokens.
func (s *Service) Register(ctx context.Context, in RegisterInput) (AuthResult, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return AuthResult{}, err
	}

	user := User{
		Email:      strings.ToLower(strings.TrimSpace(in.Email)),
		Password:   string(hash),
		Role:       in.Role,
		FullName:   strings.TrimSpace(in.FullName),
		ClinicName: strings.TrimSpace(in.ClinicName),
		Phone:      in.Phone,
		City:       in.City,
	}

	created, err := s.repo.Create(ctx, user)
	if err != nil {
		return AuthResult{}, err
	}

	return s.issue(created)
}

// Login verifies credentials and issues tokens.
func (s *Service) Login(ctx context.Context, in LoginInput) (AuthResult, error) {
	user, err := s.repo.GetByEmail(ctx, strings.ToLower(strings.TrimSpace(in.Email)))
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return AuthResult{}, ErrInvalidCredentials
		}
		return AuthResult{}, err
	}

	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(in.Password)) != nil {
		return AuthResult{}, ErrInvalidCredentials
	}

	return s.issue(user)
}

// Refresh validates a refresh token and issues a new token pair.
func (s *Service) Refresh(ctx context.Context, refreshToken string) (AuthResult, error) {
	claims, err := s.tokens.ParseRefresh(refreshToken)
	if err != nil {
		return AuthResult{}, ErrInvalidToken
	}

	user, err := s.repo.GetByID(ctx, claims.Subject)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return AuthResult{}, ErrInvalidToken
		}
		return AuthResult{}, err
	}

	return s.issue(user)
}

// Me returns the current user's profile.
func (s *Service) Me(ctx context.Context, userID string) (User, error) {
	return s.repo.GetByID(ctx, userID)
}

// ListLabs returns labs a dentist can assign cases to.
func (s *Service) ListLabs(ctx context.Context) ([]Lab, error) {
	return s.repo.ListLabs(ctx)
}

func (s *Service) issue(user User) (AuthResult, error) {
	tokens, err := s.tokens.Generate(user.ID, user.Role)
	if err != nil {
		return AuthResult{}, err
	}
	return AuthResult{User: user, Tokens: tokens}, nil
}
