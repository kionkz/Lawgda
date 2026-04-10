/**
 * POST /api/verify
 *
 * Verifies the integrity and authenticity of a signed document.
 *
 * Two verification modes:
 *   1. By documentId (GET /api/verify?id=<id>) – lookup stored record and
 *      compare metadata.
 *   2. By file re-upload (POST multipart: file + documentId) – re-hash the
 *      original document, compare against the stored hash, and verify the
 *      digital signature.
 *
 * Returns: VerificationResult JSON
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { verifySignature } from "@/lib/signing";
import { sha256Hex } from "@/lib/hash";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("id");

  if (!documentId) {
    return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
  }

  return lookupDocument(documentId);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentId = formData.get("documentId") as string | null;

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    if (!file) {
      // No file provided – just do a metadata lookup
      return lookupDocument(documentId);
    }

    const supabase = createServerClient();

    // Fetch the stored document record
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Re-hash the uploaded file (server-side verification)
    const fileBuffer = await file.arrayBuffer();
    const recomputedHash = await sha256Hex(fileBuffer);

    const hashMatch = recomputedHash.toLowerCase() === doc.original_hash.toLowerCase();

    const signatureValid = verifySignature(
      doc.original_hash,
      doc.signature,
      doc.certificate_pem
    );

    const isValid = hashMatch && signatureValid;

    // Update verification status in DB
    await supabase
      .from("documents")
      .update({ status: isValid ? "verified" : "failed" })
      .eq("id", documentId);

    return NextResponse.json({
      isValid,
      documentId: doc.id,
      filename: doc.filename,
      signerEmail: doc.signer_email,
      certificateSubject: doc.certificate_subject,
      signedAt: doc.signed_at,
      hashMatch,
      signatureValid,
      message: isValid
        ? "Document is authentic and has not been tampered with."
        : !hashMatch
        ? "Document hash mismatch – the file may have been modified."
        : "Signature verification failed – the signature is invalid.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function lookupDocument(documentId: string) {
  const supabase = createServerClient();

  const { data: doc, error } = await supabase
    .from("documents")
    .select(
      "id, filename, signer_email, certificate_subject, signed_at, original_hash, signature, certificate_pem, status"
    )
    .eq("id", documentId)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Verify signature from stored data
  const signatureValid = verifySignature(
    doc.original_hash,
    doc.signature,
    doc.certificate_pem
  );

  return NextResponse.json({
    isValid: signatureValid,
    documentId: doc.id,
    filename: doc.filename,
    signerEmail: doc.signer_email,
    certificateSubject: doc.certificate_subject,
    signedAt: doc.signed_at,
    hashMatch: true, // No file to re-hash in metadata-only lookup
    signatureValid,
    message: signatureValid
      ? "Signature is cryptographically valid."
      : "Signature verification failed.",
  });
}
