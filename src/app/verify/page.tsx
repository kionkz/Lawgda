"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { hashFile } from "@/lib/hash";
import type { VerificationResult } from "@/types";

function VerifyContent() {
  const searchParams = useSearchParams();
  const documentIdParam = searchParams.get("id");

  const [mode, setMode] = useState<"id" | "file">("id");
  const [documentId, setDocumentId] = useState(documentIdParam ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-verify if a document ID is in the URL
  useEffect(() => {
    if (!documentIdParam) return;
    setIsVerifying(true);
    setError(null);
    setResult(null);
    fetch(`/api/verify?id=${encodeURIComponent(documentIdParam)}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error ?? "Verification failed");
        setResult(data as VerificationResult);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setIsVerifying(false));
  }, [documentIdParam]);

  const verifyById = async (id: string) => {
    setIsVerifying(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/verify?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      setResult(data as VerificationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyByFile = async () => {
    if (!file || !documentId) return;
    setIsVerifying(true);
    setError(null);
    setResult(null);
    try {
      // Re-hash the file client-side first (display only – server will re-hash too)
      const hash = await hashFile(file);
      setFileHash(hash);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentId", documentId);

      const res = await fetch("/api/verify", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      setResult(data as VerificationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify a Document</h1>
      <p className="text-sm text-gray-500 mb-8">
        Confirm that a signed document has not been tampered with and that the
        digital signature is cryptographically valid.
      </p>

      {/* Mode toggle */}
      {!documentIdParam && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("id")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "id"
                ? "bg-[#183C95] text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Verify by Document ID
          </button>
          <button
            onClick={() => setMode("file")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "file"
                ? "bg-[#183C95] text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Verify by File Upload
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        {/* ID mode */}
        {(mode === "id" || documentIdParam) && !result && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Document ID
              </label>
              <input
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                readOnly={!!documentIdParam}
              />
            </div>
            {isVerifying ? (
              <div className="text-center py-4 text-sm text-gray-500">
                Verifying…
              </div>
            ) : (
              <button
                onClick={() => verifyById(documentId)}
                disabled={!documentId || isVerifying}
                className="w-full bg-[#183C95] hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                Verify Document
              </button>
            )}
          </>
        )}

        {/* File mode */}
        {mode === "file" && !result && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Document ID
              </label>
              <input
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Original PDF (re-upload to verify)
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {fileHash && (
              <p className="text-xs text-gray-500 font-mono break-all">
                Client hash: {fileHash}
              </p>
            )}
            <button
              onClick={verifyByFile}
              disabled={!file || !documentId || isVerifying}
              className="w-full bg-[#183C95] hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {isVerifying ? "Verifying…" : "Verify Document"}
            </button>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Status banner */}
            <div
              className={`rounded-xl p-4 flex items-start gap-3 ${
                result.isValid
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <span className="text-2xl">{result.isValid ? "✅" : "❌"}</span>
              <div>
                <p
                  className={`font-semibold ${
                    result.isValid ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.isValid ? "Document Verified" : "Verification Failed"}
                </p>
                <p
                  className={`text-sm mt-0.5 ${
                    result.isValid ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {result.message}
                </p>
              </div>
            </div>

            {/* Checks */}
            <div className="space-y-2">
              <CheckRow
                label="Hash Match"
                value={result.hashMatch}
                detail="SHA-256 hash of the original document matches the stored record"
              />
              <CheckRow
                label="Signature Valid"
                value={result.signatureValid}
                detail="RSA-SHA256 signature verified against the signer's certificate"
              />
            </div>

            {/* Metadata */}
            <div className="text-sm space-y-2 border-t border-gray-100 pt-4">
              <MetaRow label="Document ID" value={result.documentId} mono />
              <MetaRow label="Filename" value={result.filename} />
              <MetaRow label="Signer" value={result.signerEmail} />
              <MetaRow
                label="Certificate Subject"
                value={result.certificateSubject}
              />
              <MetaRow
                label="Signed At"
                value={new Date(result.signedAt).toLocaleString("en-PH", {
                  timeZone: "Asia/Manila",
                }) + " PHT"}
              />
            </div>

            <button
              onClick={() => {
                setResult(null);
                setError(null);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Verify another document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg bg-gray-50">
      <span className="text-lg mt-0.5">{value ? "✅" : "❌"}</span>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-800 text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading…</div>}>
      <VerifyContent />
    </Suspense>
  );
}
