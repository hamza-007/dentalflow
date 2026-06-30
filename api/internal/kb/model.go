// Package kb is the RAG knowledge base: manufacturer tech-sheet chunks and
// hybrid (vector + keyword) retrieval grounding the fiche de fabrication.
package kb

// Document is a manufacturer tech sheet / technique reference (kb_documents).
type Document struct {
	Title        string `json:"title"`
	Manufacturer string `json:"manufacturer"`
	Product      string `json:"product"`
	Material     string `json:"material"`
	SourceURL    string `json:"source_url"`
}

// ChunkInput is a curated chunk to ingest (kb_chunks, before embedding).
type ChunkInput struct {
	Content       string `json:"content"`
	ParameterType string `json:"parameter_type"`
	Page          int    `json:"page"`
}

// SeedFile is the on-disk shape consumed by cmd/seed-kb.
type SeedFile struct {
	Document Document     `json:"document"`
	Chunks   []ChunkInput `json:"chunks"`
}

// RetrievedChunk is a chunk returned from retrieval, carrying provenance.
// SourceID (the kb_chunks UUID) is the citation key used by the fiche guardrail.
type RetrievedChunk struct {
	SourceID      string `json:"source_id"`
	Content       string `json:"content"`
	ParameterType string `json:"parameter_type"`
	Page          int    `json:"page"`
	Title         string `json:"title"`
	Manufacturer  string `json:"manufacturer"`
	Product       string `json:"product"`
	Material      string `json:"material"`
}
