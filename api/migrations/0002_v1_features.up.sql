-- 0002_v1_features — V1 additions: returns/corrections, reception checklist,
-- delivery signature, and in-app notifications.

-- Reception checklist + physical-reception timestamp, and delivery signature.
ALTER TABLE cases
  ADD COLUMN reception_checklist JSONB,
  ADD COLUMN received_at         TIMESTAMPTZ,
  ADD COLUMN delivery_signature  TEXT,        -- base64 data URL of the dentist's signature
  ADD COLUMN signed_at           TIMESTAMPTZ;

-- Structured return/correction records (motifs).
CREATE TABLE case_returns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      UUID NOT NULL REFERENCES cases(id),
  returned_by  UUID NOT NULL REFERENCES users(id),
  reasons      TEXT[] NOT NULL,     -- e.g. ['teinte','occlusion']
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_returns_case ON case_returns(case_id);

-- In-app notifications.
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  case_id     UUID REFERENCES cases(id),
  type        TEXT NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
