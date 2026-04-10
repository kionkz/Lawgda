/**
 * POST /api/sign
 *
 * Signs a document using the signer's key stored in KMS.
 *
 * Accepts multipart/form-data with:
 *   - file: PDF file (the original document)
 *   - hash: SHA-256 hex hash of the file (computed client-side)
 *   - email: Signer's email (used to look up the KMS key)
 *
 * Returns: SigningResult JSON
 *
 * Security: The private key is decrypted in memory only for the duration of
 * this request and is never logged or persisted in plaintext. The server
 * independently re-hashes the uploaded file and rejects requests where the
 * client-provided hash does not match.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { decryptPrivateKey } from "@/lib/kms";
import { signHash } from "@/lib/signing";
import { appendSignaturePage } from "@/lib/pdf";
import { sha256Hex } from "@/lib/hash";
import { randomUUID } from "crypto";

const SIGNED_DOCS_BUCKET = "signed-documents";
const ORIGINAL_DOCS_BUCKET = "original-documents";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const clientHash = formData.get("hash") as string | null;
    const email = formData.get("email") as string | null;

    if (!file || !clientHash || !email) {
      return NextResponse.json(
        { error: "file, hash, and email are required" },
        { status: 400 }
      );
    }

    // Validate hash format (64 hex chars)
    if (!/^[0-9a-f]{64}$/i.test(clientHash)) {
      return NextResponse.json(
        { error: "Invalid SHA-256 hash format" },
        { status: 400 }
      );
    }

    // Read original bytes early so we can independently verify the hash
    const originalBytes = new Uint8Array(await file.arrayBuffer());

    // Server-side re-hash and comparison to prevent hash substitution attacks
    const serverHash = await sha256Hex(originalBytes.buffer as ArrayBuffer);
    if (serverHash.toLowerCase() !== clientHash.toLowerCase()) {
      return NextResponse.json(
        { error: "Provided hash does not match the uploaded file" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Retrieve the signer's key record from KMS
    const { data: keyRecord, error: keyError } = await supabase
      .from("kms_keys")
      .select("id, encrypted_private_key, certificate_pem, certificate_subject")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (keyError || !keyRecord) {
      return NextResponse.json(
        { error: "No certificate found for this email. Please upload your .p12 first." },
        { status: 404 }
      );
    }

    // Decrypt the private key from KMS (in-memory only)
    const privateKeyPem = decryptPrivateKey(
      keyRecord.encrypted_private_key,
      keyRecord.id
    ).toString("utf8");

    // Sign the client-provided hash
    const signature = signHash(clientHash, privateKeyPem);

    const documentId = randomUUID();
    const signedAt = new Date().toISOString();
    const verificationBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // originalBytes already read above for server-side hash verification

    // Upload the original document to Supabase Storage
    const originalPath = `${documentId}/original_${file.name}`;
    const { error: uploadOriginalError } = await supabase.storage
      .from(ORIGINAL_DOCS_BUCKET)
      .upload(originalPath, originalBytes, { contentType: "application/pdf" });

    if (uploadOriginalError) {
      console.error("Original upload error:", uploadOriginalError);
      return NextResponse.json(
        { error: "Failed to store original document" },
        { status: 500 }
      );
    }

    // Generate the signed PDF (original + appended signature page)
    const signedPdfBytes = await appendSignaturePage(originalBytes, {
      filename: file.name,
      sha256Hash: clientHash,
      signature,
      signerEmail: email,
      certificateSubject: keyRecord.certificate_subject,
      signedAt,
      documentId,
      verificationBaseUrl,
    });

    // Upload the signed document to Supabase Storage
    const signedPath = `${documentId}/signed_${file.name}`;
    const { error: uploadSignedError } = await supabase.storage
      .from(SIGNED_DOCS_BUCKET)
      .upload(signedPath, signedPdfBytes, { contentType: "application/pdf" });

    if (uploadSignedError) {
      console.error("Signed upload error:", uploadSignedError);
      return NextResponse.json(
        { error: "Failed to store signed document" },
        { status: 500 }
      );
    }

    // Store document record in database
    const { error: dbError } = await supabase.from("documents").insert({
      id: documentId,
      filename: file.name,
      original_hash: clientHash,
      signature,
      signer_email: email,
      certificate_subject: keyRecord.certificate_subject,
      certificate_pem: keyRecord.certificate_pem,
      signed_at: signedAt,
      signed_document_path: signedPath,
      original_document_path: originalPath,
      status: "signed",
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to record document metadata" },
        { status: 500 }
      );
    }

    // Return the signed PDF as base64
    const signedPdfBase64 = Buffer.from(signedPdfBytes).toString("base64");

    return NextResponse.json({
      documentId,
      signedPdfBase64,
      signature,
      hash: clientHash,
      qrCodeData: `${verificationBaseUrl}/verify?id=${documentId}`,
      signedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Sign error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
