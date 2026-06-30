// Package config loads runtime configuration from environment variables.
package config

import (
	"time"

	"github.com/caarlos0/env/v11"
)

// Config holds all runtime configuration. Values come from the environment
// (see .env.example at the repo root).
type Config struct {
	DatabaseURL string `env:"DATABASE_URL,required"`

	APIPort  string `env:"API_PORT" envDefault:"8080"`
	APIEnv   string `env:"API_ENV" envDefault:"development"`
	LogLevel string `env:"LOG_LEVEL" envDefault:"info"`

	CORSAllowedOrigins []string `env:"CORS_ALLOWED_ORIGINS" envSeparator:"," envDefault:"http://localhost:3000"`

	JWTAccessSecret  string        `env:"JWT_ACCESS_SECRET,required"`
	JWTRefreshSecret string        `env:"JWT_REFRESH_SECRET,required"`
	JWTAccessTTL     time.Duration `env:"JWT_ACCESS_TTL" envDefault:"15m"`
	JWTRefreshTTL    time.Duration `env:"JWT_REFRESH_TTL" envDefault:"168h"`

	UploadDir       string `env:"UPLOAD_DIR" envDefault:"./uploads"`
	MaxUploadSizeMB int64  `env:"MAX_UPLOAD_SIZE_MB" envDefault:"10"`
}

// Load parses configuration from the current environment.
func Load() (Config, error) {
	var cfg Config
	if err := env.Parse(&cfg); err != nil {
		return Config{}, err
	}
	return cfg, nil
}
