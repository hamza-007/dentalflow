package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// tokenType distinguishes access tokens from refresh tokens so a refresh token
// cannot be used as an access token.
const (
	tokenTypeAccess  = "access"
	tokenTypeRefresh = "refresh"
)

// Claims is the JWT payload. Subject (sub) holds the user ID.
type Claims struct {
	Role string `json:"role,omitempty"`
	Type string `json:"typ"`
	jwt.RegisteredClaims
}

// TokenManager issues and verifies JWTs.
type TokenManager struct {
	accessSecret  []byte
	refreshSecret []byte
	accessTTL     time.Duration
	refreshTTL    time.Duration
}

// NewTokenManager builds a TokenManager from secrets and TTLs.
func NewTokenManager(accessSecret, refreshSecret string, accessTTL, refreshTTL time.Duration) *TokenManager {
	return &TokenManager{
		accessSecret:  []byte(accessSecret),
		refreshSecret: []byte(refreshSecret),
		accessTTL:     accessTTL,
		refreshTTL:    refreshTTL,
	}
}

// Generate issues a fresh access + refresh pair for a user.
func (m *TokenManager) Generate(userID, role string) (Tokens, error) {
	now := time.Now()

	access, err := m.sign(m.accessSecret, Claims{
		Role: role,
		Type: tokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.accessTTL)),
		},
	})
	if err != nil {
		return Tokens{}, err
	}

	refresh, err := m.sign(m.refreshSecret, Claims{
		Type: tokenTypeRefresh,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.refreshTTL)),
		},
	})
	if err != nil {
		return Tokens{}, err
	}

	return Tokens{AccessToken: access, RefreshToken: refresh}, nil
}

// ParseAccess verifies an access token and returns its claims.
func (m *TokenManager) ParseAccess(token string) (*Claims, error) {
	return m.parse(token, m.accessSecret, tokenTypeAccess)
}

// ParseRefresh verifies a refresh token and returns its claims.
func (m *TokenManager) ParseRefresh(token string) (*Claims, error) {
	return m.parse(token, m.refreshSecret, tokenTypeRefresh)
}

func (m *TokenManager) sign(secret []byte, claims Claims) (string, error) {
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(secret)
}

func (m *TokenManager) parse(token string, secret []byte, wantType string) (*Claims, error) {
	claims := &Claims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return secret, nil
	})
	if err != nil || !parsed.Valid {
		return nil, ErrInvalidToken
	}
	if claims.Type != wantType {
		return nil, ErrInvalidToken
	}
	if claims.Subject == "" {
		return nil, ErrInvalidToken
	}
	return claims, nil
}
