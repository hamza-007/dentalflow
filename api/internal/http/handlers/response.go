// Package handlers contains thin HTTP handlers: parse request, call a service,
// write the response. No business logic lives here (CLAUDE.md §8).
package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New(validator.WithRequiredStructEnabled())

// errorBody is the standard error envelope: {"error":{"code","message"}} (§7).
type errorBody struct {
	Error errorDetail `json:"error"`
}

type errorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// dataBody is the standard success envelope: {"data": ...} (optionally with meta).
type dataBody struct {
	Data any      `json:"data"`
	Meta *metaObj `json:"meta,omitempty"`
}

type metaObj struct {
	Total int `json:"total"`
}

// writeJSON serializes v as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// writeData writes a success envelope.
func writeData(w http.ResponseWriter, status int, data any) {
	writeJSON(w, status, dataBody{Data: data})
}

// writeList writes a success envelope with a total-count meta.
func writeList(w http.ResponseWriter, status int, data any, total int) {
	writeJSON(w, status, dataBody{Data: data, Meta: &metaObj{Total: total}})
}

// writeError writes the standard error envelope.
func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, errorBody{Error: errorDetail{Code: code, Message: message}})
}

// decodeJSON decodes a JSON request body into dst, rejecting unknown fields and
// empty bodies.
func decodeJSON(r *http.Request, dst any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		if errors.Is(err, io.EOF) {
			return errors.New("request body is empty")
		}
		return err
	}
	return nil
}

// decodeAndValidate decodes the JSON body and runs struct validation tags.
func decodeAndValidate(r *http.Request, dst any) error {
	if err := decodeJSON(r, dst); err != nil {
		return err
	}
	return validate.Struct(dst)
}
