// Command seed-kb inserts a curated KB seed file into kb_documents / kb_chunks.
// Run by the DEVELOPER. No external services needed (deterministic fiche).
//
//	go run ./cmd/seed-kb [path/to/seed.json]
//
// Default seed: internal/kb/seed/zirconia_crown.json
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"dentalflow/api/internal/config"
	"dentalflow/api/internal/db"
	"dentalflow/api/internal/kb"
)

const defaultSeed = "internal/kb/seed/zirconia_crown.json"

func main() {
	for _, f := range []string{".env", "../.env"} {
		_ = godotenv.Load(f)
	}
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	// Ensure the schema exists (safe to run before the server has started).
	if err := db.Migrate(cfg.DatabaseURL, slog.Default()); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	path := defaultSeed
	if len(os.Args) > 1 {
		path = os.Args[1]
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		log.Fatalf("read seed %s: %v", path, err)
	}
	var seed kb.SeedFile
	if err := json.Unmarshal(raw, &seed); err != nil {
		log.Fatalf("parse seed: %v", err)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect db: %v", err)
	}
	defer pool.Close()

	svc := kb.NewService(kb.NewRepository(pool))
	n, err := svc.Reseed(ctx, seed.Document, seed.Chunks)
	if err != nil {
		log.Fatalf("seed kb: %v", err)
	}

	fmt.Printf("seeded %d chunks from %q (%s)\n", n, seed.Document.Title, path)
}
