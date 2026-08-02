-- ponytail: one attachment per transaction; add a transaction_attachments table when multiple files are needed.
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS attachment_path VARCHAR(500) NULL AFTER savings_goal_id,
  ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255) NULL AFTER attachment_path,
  ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(100) NULL AFTER attachment_name;
