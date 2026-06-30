package db

import (
	"errors"
	"fmt"
	"log/slog"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres" // registers the "postgres" driver
	"github.com/golang-migrate/migrate/v4/source/iofs"

	"dentalflow/api/migrations"
)

// Migrate applies all pending up migrations against databaseURL using the
// embedded migration files. It is a no-op when the schema is already current.
func Migrate(databaseURL string, logger *slog.Logger) error {
	src, err := iofs.New(migrations.FS, ".")
	if err != nil {
		return fmt.Errorf("load embedded migrations: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", src, databaseURL)
	if err != nil {
		return fmt.Errorf("init migrator: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			logger.Info("migrations: schema already up to date")
			return nil
		}
		return fmt.Errorf("run migrations: %w", err)
	}

	logger.Info("migrations: applied successfully")
	return nil
}
