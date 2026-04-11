# Lawgda

Secure Legal Document Management System — Capstone Project

## Overview

Lawgda is a Next.js web application that simulates the core user experience for secure electronic evidence management, featuring:

- **Client-side SHA-256 hashing** — document fingerprints are computed entirely in the browser using the Web Crypto API
- **Bring Your Own Certificate (BYOC)** — upload your `.p12` certificate to bind your identity to documents
- **Simulated Signing** — Appended Certificate Model (original PDF is never modified; a separate signature page with QR code is generated)
- **Document Verification** — check document integrity and certificate validity
- **AES-256 KMS** (simulated) — key management infrastructure described in the UI

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
pages/
  index.js          # Main dashboard (login, upload, sign, verify flow)
  _app.js           # App wrapper
  api/
    sign.js         # Mock signing API route
    verify.js       # Mock verification API route
components/
  DocumentUploader.js   # PDF upload + SHA-256 hashing component
  ByocUploader.js       # .p12 certificate upload component
styles/
  globals.css       # Tailwind CSS base styles
```

## Tech Stack

- **Framework:** Next.js 16 (Pages Router)
- **Styling:** Tailwind CSS v4
- **Crypto:** Web Crypto API (`crypto.subtle.digest`) — runs client-side, no server involvement

## MVP Demo Flow

1. **Login** — enter any email/password to simulate authentication
2. **Upload PDF** — SHA-256 hash is computed in the browser and displayed immediately
3. **Upload BYOC Certificate** — upload a `.p12` file, enter password, and load certificate metadata
4. **Sign Document** — triggers a simulated backend call; displays the Appended Signature Page with QR code
5. **Verify Integrity** — simulates verification and shows hash match, certificate validity, and authenticity status
