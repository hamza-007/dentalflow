// Command seed inserts demo data: 1 lab, 1 dentist, and 3 sample cases in
// different statuses. Safe to re-run — it upserts the demo users and replaces
// the demo cases (patient_ref prefixed "DEMO-").
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"

	"dentalflow/api/internal/config"
)

const demoPassword = "password123"

func main() {
	for _, f := range []string{".env", "../.env"} {
		_ = godotenv.Load(f)
	}
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect db: %v", err)
	}
	defer pool.Close()

	hash, err := bcrypt.GenerateFromPassword([]byte(demoPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("hash password: %v", err)
	}

	dentistID, err := upsertUser(ctx, pool, string(hash),
		"demo.dentist@dentalflow.tn", "dentist", "Dr. Sami Ben Salah", "Cabinet Dentaire Carthage", "Tunis")
	if err != nil {
		log.Fatalf("seed dentist: %v", err)
	}
	labID, err := upsertUser(ctx, pool, string(hash),
		"demo.lab@dentalflow.tn", "lab", "Atelier Prothèse Lac", "Labo Dentaire Le Lac", "Tunis")
	if err != nil {
		log.Fatalf("seed lab: %v", err)
	}

	// Replace any existing demo cases (cascade-free: delete children first).
	if err := clearDemoCases(ctx, pool); err != nil {
		log.Fatalf("clear demo cases: %v", err)
	}

	now := time.Now()
	samples := []struct {
		patientRef string
		teeth      []string
		ptype      string
		material   string
		shade      string
		status     string
		priority   string
		due        time.Time
	}{
		{"DEMO-AB1990", []string{"16"}, "crown", "Zircone", "A2", "new", "normal", now.AddDate(0, 0, 7)},
		{"DEMO-CD1985", []string{"24", "25", "26"}, "bridge", "Métal-céramique", "A3", "fabricating", "urgent", now.AddDate(0, 0, 2)},
		{"DEMO-EF2000", []string{"11"}, "veneer", "Céramique feldspathique", "B1", "delivered", "normal", now.AddDate(0, 0, -3)},
	}

	for _, s := range samples {
		caseID, err := insertCase(ctx, pool, dentistID, labID, s.patientRef, s.teeth, s.ptype, s.material, s.shade, s.status, s.priority, s.due)
		if err != nil {
			log.Fatalf("insert case %s: %v", s.patientRef, err)
		}
		if err := seedHistory(ctx, pool, caseID, labID, s.status); err != nil {
			log.Fatalf("seed history %s: %v", s.patientRef, err)
		}
		fmt.Printf("seeded case %s (%s) status=%s\n", s.patientRef, caseID, s.status)
	}

	fmt.Println("\nDemo accounts (password: " + demoPassword + ")")
	fmt.Println("  dentist: demo.dentist@dentalflow.tn")
	fmt.Println("  lab:     demo.lab@dentalflow.tn")
}

func upsertUser(ctx context.Context, pool *pgxpool.Pool, hash, email, role, fullName, clinic, city string) (string, error) {
	const q = `
		INSERT INTO users (email, password, role, full_name, clinic_name, city)
		VALUES ($1,$2,$3,$4,$5,$6)
		ON CONFLICT (email) DO UPDATE
			SET password = EXCLUDED.password, full_name = EXCLUDED.full_name,
			    clinic_name = EXCLUDED.clinic_name, city = EXCLUDED.city
		RETURNING id`
	var id string
	err := pool.QueryRow(ctx, q, email, hash, role, fullName, clinic, city).Scan(&id)
	return id, err
}

func clearDemoCases(ctx context.Context, pool *pgxpool.Pool) error {
	const del = `
		WITH demo AS (SELECT id FROM cases WHERE patient_ref LIKE 'DEMO-%')
		DELETE FROM cases WHERE id IN (SELECT id FROM demo)`
	// status_history / messages / case_files reference cases; delete them first.
	for _, child := range []string{
		`DELETE FROM status_history WHERE case_id IN (SELECT id FROM cases WHERE patient_ref LIKE 'DEMO-%')`,
		`DELETE FROM messages WHERE case_id IN (SELECT id FROM cases WHERE patient_ref LIKE 'DEMO-%')`,
		`DELETE FROM case_files WHERE case_id IN (SELECT id FROM cases WHERE patient_ref LIKE 'DEMO-%')`,
	} {
		if _, err := pool.Exec(ctx, child); err != nil {
			return err
		}
	}
	_, err := pool.Exec(ctx, del)
	return err
}

func insertCase(ctx context.Context, pool *pgxpool.Pool, dentistID, labID, ref string, teeth []string, ptype, material, shade, status, priority string, due time.Time) (string, error) {
	const q = `
		INSERT INTO cases
			(dentist_id, lab_id, patient_ref, teeth, prosthesis_type, material, shade, status, priority, due_date, extra_fields)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'{}')
		RETURNING id`
	var id string
	err := pool.QueryRow(ctx, q, dentistID, labID, ref, teeth, ptype, material, shade, status, priority, due).Scan(&id)
	return id, err
}

// seedHistory writes a plausible status trail up to the case's current status.
func seedHistory(ctx context.Context, pool *pgxpool.Pool, caseID, labID, status string) error {
	trail := map[string][]string{
		"new":         {},
		"fabricating": {"accepted", "designing", "fabricating"},
		"delivered":   {"accepted", "designing", "fabricating", "checking", "ready", "delivered"},
	}[status]

	from := "new"
	for _, to := range trail {
		const q = `INSERT INTO status_history (case_id, from_status, to_status, changed_by) VALUES ($1,$2,$3,$4)`
		if _, err := pool.Exec(ctx, q, caseID, from, to, labID); err != nil {
			return err
		}
		from = to
	}
	return nil
}
