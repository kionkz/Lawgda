# Lawgda

**Lawgda** is a secure legal document management system focused on electronic evidence. It allows users to digitally sign PDF documents with their own certificates, append a tamper-evident signature page, and verify document authenticity via QR code.

## Features

- **Client-Side SHA-256 Hashing** – Documents are hashed in the browser using the Web Crypto API. The original file bytes never leave your device unprocessed.
- **Bring Your Own Certificate (BYOC)** – Upload a PKCS#12 (.p12) certificate. Your private key is encrypted with AES-256-GCM before storage.
- **AES-256-GCM Key Management System (KMS)** – Private keys are encrypted using HKDF-derived keys and only decrypted in-memory during signing.
- **RSA-SHA256 Digital Signatures** – The backend orchestrates signing using the KMS-protected private key and the client-provided SHA-256 hash.
- **Appended Certificate Model** – A separate signature page with a dynamic QR code is appended to the original PDF. The original is never modified.
- **Cryptographic Verification** – Re-upload the original document to verify: the system re-hashes, compares against the stored hash, and validates the RSA signature.
- **Regulatory Compliance** – Designed to adhere to REE, RA 8792 (E-Commerce Act), and RA 10173 (Data Privacy Act) – Privacy by Design.

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | Next.js 16 + React 19 + Tailwind  |
| Database    | Supabase (PostgreSQL)             |
| Storage     | Supabase Storage                  |
| KMS         | AES-256-GCM with HKDF-SHA256      |
| Signing     | RSA-SHA256 via node-forge (BYOC)  |
| Hashing     | SHA-256 via Web Crypto API        |
| PDF         | pdf-lib + qrcode                  |
| Hosting     | Vercel                            |

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/kionkz/Lawgda
cd Lawgda
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials and KMS secret
```

### 3. Set Up Supabase

1. Create a new [Supabase](https://supabase.com) project.
2. Run the schema from `supabase/schema.sql` in the SQL editor.
3. Create two **private** Storage buckets: `original-documents` and `signed-documents`.
4. Copy your project URL, anon key, and service role key into `.env.local`.

### 4. Generate KMS Secret

```bash
openssl rand -hex 32
# Paste the result as KMS_MASTER_SECRET in .env.local
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## User Flow

```
User                         Browser                     API / KMS / DB
 │                              │                              │
 ├── Upload PDF ──────────────► │                              │
 │                              ├── SHA-256 hash (client) ──► │
 │                              │                              │
 ├── Upload .p12 + password ──► │                              │
 │                              ├── POST /api/kms/store ──────►│
 │                              │                              ├── parseP12()
 │                              │                              ├── encryptPrivateKey() [AES-256-GCM]
 │                              │                              └── INSERT kms_keys
 │                              │                              │
 ├── Click "Sign" ────────────► │                              │
 │                              ├── POST /api/sign ───────────►│
 │                              │    (file + hash + email)     ├── SELECT kms_keys
 │                              │                              ├── decryptPrivateKey() [in-memory]
 │                              │                              ├── signHash() [RSA-SHA256]
 │                              │                              ├── appendSignaturePage() [pdf-lib + QR]
 │                              │                              ├── Upload to Supabase Storage
 │                              │                              └── INSERT documents
 │                              │                              │
 ├── Download signed PDF ◄───── │ ◄── signedPdfBase64 ────────┤
 │                              │                              │
 ├── Scan QR / verify ────────► │                              │
 │                              ├── GET /api/verify?id=... ───►│
 │                              │   or                         ├── verifySignature()
 │                              ├── POST /api/verify ─────────►│
 │                              │    (file + documentId)       └── hashMatch + sigValid
 │ ◄── ✅ Verified ─────────── │                              │
```

## API Routes

| Method | Route                 | Description                                 |
|--------|-----------------------|---------------------------------------------|
| POST   | `/api/kms/store`      | Store encrypted BYOC private key            |
| POST   | `/api/sign`           | Sign a document (multipart: file+hash+email)|
| GET    | `/api/verify?id=`     | Verify document by ID (metadata lookup)     |
| POST   | `/api/verify`         | Verify document by re-uploading original    |
| GET    | `/api/documents?email=` | List documents by signer email            |

## Compliance

- **RA 8792** – Electronic Commerce Act of the Philippines
- **RA 10173** – Data Privacy Act (Privacy by Design)
- **REE** – Rules on Electronic Evidence
