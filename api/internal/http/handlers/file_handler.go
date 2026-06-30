package handlers

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"dentalflow/api/internal/cases"
	"dentalflow/api/internal/files"
	appmw "dentalflow/api/internal/http/middleware"
)

// FileHandler exposes the per-case file endpoints.
type FileHandler struct {
	service  *files.Service
	maxBytes int64
}

// NewFileHandler wires the file handler. maxUploadMB caps a single upload.
func NewFileHandler(service *files.Service, maxUploadMB int64) *FileHandler {
	return &FileHandler{service: service, maxBytes: maxUploadMB << 20}
}

// List handles GET /cases/:id/files.
func (h *FileHandler) List(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")
	list, err := h.service.List(r.Context(), appmw.UserID(r.Context()), caseID)
	if err != nil {
		writeFileError(w, err)
		return
	}
	writeList(w, http.StatusOK, list, len(list))
}

// Upload handles POST /cases/:id/files (multipart/form-data: file + file_type).
func (h *FileHandler) Upload(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	r.Body = http.MaxBytesReader(w, r.Body, h.maxBytes)
	if err := r.ParseMultipartForm(h.maxBytes); err != nil {
		writeError(w, http.StatusRequestEntityTooLarge, "file_too_large", "file exceeds the maximum size")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "missing 'file' field")
		return
	}
	defer file.Close()

	fileType := r.FormValue("file_type")
	if fileType == "" {
		fileType = "other"
	}

	created, err := h.service.Upload(
		r.Context(), appmw.UserID(r.Context()), caseID, header.Filename, fileType, file,
	)
	if err != nil {
		writeFileError(w, err)
		return
	}
	writeData(w, http.StatusCreated, created)
}

// Delete handles DELETE /cases/:id/files/:file_id (uploader only).
func (h *FileHandler) Delete(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")
	fileID := chi.URLParam(r, "file_id")
	if err := h.service.Delete(r.Context(), appmw.UserID(r.Context()), caseID, fileID); err != nil {
		writeFileError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeFileError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, files.ErrForbidden):
		writeError(w, http.StatusForbidden, "forbidden", "not allowed")
	case errors.Is(err, files.ErrNotFound), errors.Is(err, cases.ErrNotFound):
		writeError(w, http.StatusNotFound, "not_found", "file not found")
	case errors.Is(err, files.ErrInvalidType):
		writeError(w, http.StatusBadRequest, "invalid_type", "file_type must be photo, scan, xray or other")
	case errors.Is(err, files.ErrTooLarge):
		writeError(w, http.StatusRequestEntityTooLarge, "file_too_large", "file too large")
	default:
		writeError(w, http.StatusInternalServerError, "internal_error", "something went wrong")
	}
}
