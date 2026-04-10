"use client";

import { useState } from "react";
import DocumentUpload from "@/components/DocumentUpload";
import CertificateUpload from "@/components/CertificateUpload";
import type { SigningResult } from "@/types";

type Step = "upload" | "certificate" | "sign" | "done";

export default function SignPage() {
  const [step, setStep] = useState<Step>("upload");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docHash, setDocHash] = useState<string | null>(null);
  const [signerEmail, setSignerEmail] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [result, setResult] = useState<SigningResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDocumentReady = (hash: string, file: File) => {
    setDocHash(hash);
    setDocFile(file);
    setStep("certificate");
  };

  const handleCertificateReady = () => {
    setStep("sign");
  };

  const handleSign = async () => {
    if (!docFile || !docHash || !signerEmail) return;
    setIsSigning(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", docFile);
      formData.append("hash", docHash);
      formData.append("email", signerEmail);

      const res = await fetch("/api/sign", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Signing failed");

      setResult(data as SigningResult);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSigning(false);
    }
  };

  const downloadSignedPdf = () => {
    if (!result) return;
    const bytes = Uint8Array.from(atob(result.signedPdfBase64), (c) =>
      c.charCodeAt(0)
    );
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signed_${docFile?.name ?? "document.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload PDF" },
    { key: "certificate", label: "BYOC Certificate" },
    { key: "sign", label: "Sign" },
    { key: "done", label: "Done" },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign a Document</h1>
      <p className="text-sm text-gray-500 mb-8">
        Upload your PDF, provide your BYOC certificate, and receive a tamper-evident
        signed document with an appended signature page.
      </p>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < stepIndex
                  ? "bg-green-500 text-white"
                  : i === stepIndex
                  ? "bg-[#183C95] text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < stepIndex ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs hidden sm:block ${
                i === stepIndex
                  ? "font-semibold text-gray-900"
                  : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 w-8 ${
                  i < stepIndex ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload PDF */}
      {step === "upload" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Step 1 – Upload Your PDF Document
          </h2>
          <DocumentUpload onHashComputed={handleDocumentReady} />
        </div>
      )}

      {/* Step 2: BYOC Certificate */}
      {step === "certificate" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-800">
            Step 2 – Provide Your Certificate (BYOC)
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <span className="font-medium">Document ready:</span>{" "}
            {docFile?.name} — Hash:{" "}
            <span className="font-mono text-xs">{docHash?.slice(0, 16)}…</span>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">
              Signer Email (must match your certificate)
            </label>
            <input
              type="email"
              value={signerEmail ?? ""}
              onChange={(e) => setSignerEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <CertificateUpload onCertificateReady={handleCertificateReady} />
        </div>
      )}

      {/* Step 3: Sign */}
      {step === "sign" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-800">
            Step 3 – Sign Document
          </h2>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">File</span>
              <span className="font-medium">{docFile?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">SHA-256 Hash</span>
              <span className="font-mono text-xs">{docHash?.slice(0, 20)}…</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Signer</span>
              <span className="font-medium">{signerEmail}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Signature Algorithm</span>
              <span className="font-medium">RSA-SHA256</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSign}
            disabled={isSigning}
            className="w-full bg-[#183C95] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {isSigning ? "Signing… please wait" : "Sign Document"}
          </button>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && result && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
              ✅
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Document Signed Successfully
              </h2>
              <p className="text-sm text-gray-500">
                A signature page with QR code has been appended.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Document ID</span>
              <span className="font-mono text-xs">{result.documentId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Hash</span>
              <span className="font-mono text-xs">{result.hash.slice(0, 20)}…</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Signed At</span>
              <span>{new Date(result.signedAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Verification URL</span>
              <a
                href={result.qrCodeData}
                className="text-blue-600 hover:underline text-xs truncate max-w-[200px]"
              >
                {result.qrCodeData}
              </a>
            </div>
          </div>

          <button
            onClick={downloadSignedPdf}
            className="w-full bg-[#183C95] hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            ⬇ Download Signed PDF
          </button>

          <a
            href={`/verify?id=${result.documentId}`}
            className="block text-center text-sm text-blue-600 hover:underline"
          >
            View Verification Page →
          </a>
        </div>
      )}
    </div>
  );
}
