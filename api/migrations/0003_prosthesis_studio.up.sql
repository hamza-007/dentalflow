-- 0003_prosthesis_studio — V2 AI layer (CLAUDE.md §13.5).
-- Adds pgvector + the fiche generation tables and RAG knowledge base.
-- Does not alter existing MVP/V1 tables.

CREATE EXTENSION IF NOT EXISTS vector;

-- Generated fabrication guides, versioned per case.
CREATE TABLE fiches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id),
  version     INT  NOT NULL DEFAULT 1,
  content     JSONB NOT NULL,        -- structured fiche (stages, params, citations)
  pdf_url     TEXT,                  -- rendered PDF
  sources     JSONB,                 -- KB documents/chunks used
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fiches_case ON fiches(case_id);

-- RAG knowledge base: manufacturer tech sheets + technique references.
CREATE TABLE kb_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  manufacturer TEXT,                 -- VITA | Ivoclar | Zirkonzahn | ...
  product      TEXT,
  material     TEXT,
  source_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kb_chunks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id    UUID NOT NULL REFERENCES kb_documents(id),
  content        TEXT NOT NULL,
  parameter_type TEXT,               -- sintering | firing | pressing | cement | ...
  page           INT,
  embedding      vector(1024),       -- dim must match EMBEDDING_DIM / the model
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kb_chunks_doc ON kb_chunks(document_id);
-- Add an ANN index (ivfflat/hnsw) once data volume warrants it.
