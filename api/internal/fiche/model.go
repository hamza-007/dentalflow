// Package fiche generates the (French) fiche de fabrication from a case's specs
// grounded in the KB, with a cite-or-refuse guardrail (CLAUDE.md §13.3).
package fiche

import (
	"errors"
	"time"
)

var (
	ErrForbidden = errors.New("not allowed")
	ErrNotFound  = errors.New("fiche not found")
)

// Parameter is a single process value. Numeric values MUST carry a SourceID.
type Parameter struct {
	Label    string `json:"label"`
	Value    string `json:"value"`
	Unit     string `json:"unit"`
	SourceID string `json:"source_id"`
}

type Stage struct {
	Order        int         `json:"order"`
	Title        string      `json:"title"`
	Instructions string      `json:"instructions"`
	Parameters   []Parameter `json:"parameters"`
}

type CaseSummary struct {
	Type     string   `json:"type"`
	Material string   `json:"material"`
	Shade    string   `json:"shade"`
	Teeth    []string `json:"teeth"`
}

// Content is the structured fiche (the model's JSON output target).
type Content struct {
	CaseSummary CaseSummary `json:"case_summary"`
	Materials   []string    `json:"materials"`
	Equipment   []string    `json:"equipment"`
	Stages      []Stage     `json:"stages"`
	QCChecklist []string    `json:"qc_checklist"`
	Cautions    []string    `json:"cautions"`
	MissingData []string    `json:"missing_data"`
	Disclaimer  string      `json:"disclaimer"`
}

// Source is provenance for a cited chunk (stored in fiches.sources).
type Source struct {
	SourceID     string `json:"source_id"`
	Title        string `json:"title"`
	Manufacturer string `json:"manufacturer"`
	Product      string `json:"product"`
	Page         int    `json:"page"`
}

// Fiche is a persisted, versioned fabrication guide.
type Fiche struct {
	ID        string    `json:"id"`
	CaseID    string    `json:"case_id"`
	Version   int       `json:"version"`
	Content   Content   `json:"content"`
	Sources   []Source  `json:"sources"`
	CreatedBy string    `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
}
