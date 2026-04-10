-- Lawgda Supabase Database Schema
-- Run this SQL in the Supabase SQL editor to set up the required tables.

-- Enable the pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- KMS Keys table
-- Stores AES-256-GCM encrypted private keys and certificates.
-- The private key is NEVER stored in plaintext.
-- ============================================================
CREATE TABLE IF NOT EXISTS kms_keys (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,       -- AES-256-GCM ciphertext (base64)
  certificate_pem       TEXT NOT NULL,       -- Public certificate (PEM)
  certificate_subject   TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast key lookup by signer email
CREATE INDEX IF NOT EXISTS kms_keys_email_idx ON kms_keys (email);

-- Row-Level Security: use service role for server-side access
ALTER TABLE kms_keys ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Documents table
-- Stores document metadata, hashes, and digital signatures.
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename                TEXT NOT NULL,
  original_hash           TEXT NOT NULL,     -- SHA-256 hex of the original PDF
  signature               TEXT NOT NULL,     -- Base64 RSA-SHA256 signature
  signer_email            TEXT NOT NULL,
  certificate_subject     TEXT NOT NULL,
  certificate_pem         TEXT NOT NULL,     -- Signer's public certificate (PEM)
  signed_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_document_path    TEXT NOT NULL,     -- Path in Supabase Storage bucket
  original_document_path  TEXT NOT NULL,     -- Path in Supabase Storage bucket
  status                  TEXT NOT NULL DEFAULT 'signed'
                            CHECK (status IN ('pending', 'signed', 'verified', 'failed')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS documents_signer_email_idx ON documents (signer_email);
CREATE INDEX IF NOT EXISTS documents_signed_at_idx   ON documents (signed_at DESC);

-- Row-Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Automatic updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kms_keys_updated_at
  BEFORE UPDATE ON kms_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Supabase Storage buckets
-- Create these in the Supabase Dashboard > Storage:
--   - original-documents  (private)
--   - signed-documents    (private)
-- ============================================================
