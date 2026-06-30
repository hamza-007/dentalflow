-- 0001_init — core schema (CLAUDE.md §5)
-- gen_random_uuid() is built into PostgreSQL 13+ (pgcrypto not required on PG16).

CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  password     TEXT NOT NULL,           -- bcrypt hash
  role         TEXT NOT NULL,           -- 'dentist' | 'lab'
  full_name    TEXT NOT NULL,
  clinic_name  TEXT NOT NULL,           -- cabinet name or lab name
  phone        TEXT,
  city         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cases (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dentist_id       UUID NOT NULL REFERENCES users(id),
  lab_id           UUID NOT NULL REFERENCES users(id),
  patient_ref      TEXT NOT NULL,       -- anonymized: initials + birth year
  teeth            TEXT[] NOT NULL,     -- FDI numbers e.g. ['16','17']
  prosthesis_type  TEXT NOT NULL,
  material         TEXT NOT NULL,
  shade            TEXT,                -- VITA shade e.g. 'A2'
  status           TEXT NOT NULL DEFAULT 'new',
  priority         TEXT NOT NULL DEFAULT 'normal', -- 'normal' | 'urgent'
  due_date         DATE NOT NULL,
  notes            TEXT,
  extra_fields     JSONB,               -- type-specific fields
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cases_dentist ON cases(dentist_id);
CREATE INDEX idx_cases_lab     ON cases(lab_id);
CREATE INDEX idx_cases_status  ON cases(status);
CREATE INDEX idx_cases_due     ON cases(due_date);

CREATE TABLE status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id),
  from_status TEXT,
  to_status   TEXT NOT NULL,
  changed_by  UUID NOT NULL REFERENCES users(id),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_status_case ON status_history(case_id);

CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id),
  sender_id   UUID NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_case ON messages(case_id);

CREATE TABLE case_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      UUID NOT NULL REFERENCES cases(id),
  uploaded_by  UUID NOT NULL REFERENCES users(id),
  file_name    TEXT NOT NULL,
  file_url     TEXT NOT NULL,
  file_type    TEXT NOT NULL,  -- 'photo' | 'scan' | 'xray' | 'other'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_files_case ON case_files(case_id);
