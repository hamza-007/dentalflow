// Package files owns case file attachments (photos, scans) and their storage.
package files

import (
	"errors"
	"time"
)

// File types (CLAUDE.md §5).
var validFileTypes = map[string]bool{
	"photo": true, "scan": true, "xray": true, "final": true, "other": true,
}

// FileTypeFinal marks the photo of the finished prosthesis required before
// a case can be delivered (CLAUDE.md §8 / quality documentation).
const FileTypeFinal = "final"

// IsValidType reports whether t is an allowed file_type.
func IsValidType(t string) bool { return validFileTypes[t] }

// Sentinel errors.
var (
	ErrForbidden   = errors.New("not allowed")
	ErrNotFound    = errors.New("file not found")
	ErrInvalidType = errors.New("invalid file_type")
	ErrTooLarge    = errors.New("file too large")
)

// File mirrors the case_files table.
type File struct {
	ID         string    `json:"id"`
	CaseID     string    `json:"case_id"`
	UploadedBy string    `json:"uploaded_by"`
	FileName   string    `json:"file_name"`
	FileURL    string    `json:"file_url"`
	FileType   string    `json:"file_type"`
	CreatedAt  time.Time `json:"created_at"`
}
