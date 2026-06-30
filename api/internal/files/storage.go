package files

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// Storage abstracts where file bytes live, so local disk (dev) can be swapped
// for Supabase Storage later without touching the service. Objects are
// addressed by the public URL stored in the DB (case_files.file_url).
type Storage interface {
	// Save persists the content and returns its public URL.
	Save(ctx context.Context, caseID, fileName string, src io.Reader) (url string, err error)
	// Delete removes the stored object addressed by its public URL.
	Delete(ctx context.Context, url string) error
}

// LocalStorage writes files under a base directory and serves them from a URL
// prefix (mounted as a static file server by the router).
type LocalStorage struct {
	baseDir   string
	urlPrefix string
}

// NewLocalStorage builds a disk-backed Storage rooted at baseDir.
func NewLocalStorage(baseDir, urlPrefix string) *LocalStorage {
	return &LocalStorage{baseDir: baseDir, urlPrefix: strings.TrimRight(urlPrefix, "/")}
}

var unsafeChars = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

// Save stores the content at <baseDir>/<caseID>/<random>_<safeName>.
func (s *LocalStorage) Save(_ context.Context, caseID, fileName string, src io.Reader) (string, error) {
	dir := filepath.Join(s.baseDir, caseID)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", fmt.Errorf("mkdir: %w", err)
	}

	suffix, err := randomHex(8)
	if err != nil {
		return "", err
	}
	safe := unsafeChars.ReplaceAllString(filepath.Base(fileName), "_")
	stored := suffix + "_" + safe

	dst, err := os.Create(filepath.Join(dir, stored))
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}

	key := filepath.ToSlash(filepath.Join(caseID, stored))
	return s.urlPrefix + "/" + key, nil
}

// Delete removes the stored file addressed by its public URL.
func (s *LocalStorage) Delete(_ context.Context, url string) error {
	key := strings.TrimPrefix(url, s.urlPrefix+"/")
	if key == "" || key == url {
		return nil // not one of ours, or empty
	}
	err := os.Remove(filepath.Join(s.baseDir, filepath.FromSlash(key)))
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove file: %w", err)
	}
	return nil
}

func randomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
