/**
 * POST /api/kms/store
 *
 * Accepts a PKCS#12 file (base64), its password, and the signer's email.
 * Extracts the private key and certificate, encrypts the key with AES-256-GCM
 * (KMS), and stores the encrypted key + certificate in Supabase.
 *
 * Body: { p12Base64: string; password: string; email: string }
 * Returns: { keyId: string; certificateSubject: string; message: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { encryptPrivateKey } from "@/lib/kms";
import { parseP12 } from "@/lib/signing";
import { isValidEmail } from "@/lib/validation";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { p12Base64, password, email } = await req.json();

    if (!p12Base64 || !password || !email) {
      return NextResponse.json(
        { error: "p12Base64, password, and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Decode and parse the .p12 file
    const p12Buffer = Buffer.from(p12Base64, "base64");
    const { privateKeyPem, certificatePem, certificateSubject } = parseP12(
      p12Buffer,
      password
    );

    // Encrypt the private key with AES-256-GCM before storing
    const keyId = randomUUID();
    const encryptedPrivateKey = encryptPrivateKey(
      Buffer.from(privateKeyPem, "utf8"),
      keyId
    );

    // Persist to Supabase
    const supabase = createServerClient();
    const { error } = await supabase.from("kms_keys").insert({
      id: keyId,
      email,
      encrypted_private_key: encryptedPrivateKey,
      certificate_pem: certificatePem,
      certificate_subject: certificateSubject,
    });

    if (error) {
      console.error("KMS store error:", error);
      return NextResponse.json(
        { error: "Failed to store key material" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      keyId,
      certificateSubject,
      message: "Certificate and encrypted key stored successfully",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
