/**
 * GET /api/documents?email=<email>
 *
 * Returns all documents signed by the given email address.
 * Sensitive fields (signature, certificate_pem) are excluded from the response.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isValidEmail } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email query parameter is required" }, { status: 400 });
  }

  // Basic email format validation
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, filename, original_hash, signer_email, certificate_subject, signed_at, status, signed_document_path, original_document_path"
    )
    .eq("signer_email", email)
    .order("signed_at", { ascending: false });

  if (error) {
    console.error("Documents fetch error:", error instanceof Error ? error.message : "database error");
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }

  return NextResponse.json({ documents: data ?? [] });
}
