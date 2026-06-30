-- 0002_v1_features (down).
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS case_returns;

ALTER TABLE cases
  DROP COLUMN IF EXISTS reception_checklist,
  DROP COLUMN IF EXISTS received_at,
  DROP COLUMN IF EXISTS delivery_signature,
  DROP COLUMN IF EXISTS signed_at;
