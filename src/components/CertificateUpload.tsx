"use client";

import { useState, useRef } from "react";

interface CertificateUploadProps {
  onCertificateReady: () => void;
}

export default function CertificateUpload({
  onCertificateReady,
}: CertificateUploadProps) {
  const [p12File, setP12File] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [keyId, setKeyId] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p12File || !password || !email) {
      setError("Please provide the .p12 file, password, and email.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const arrayBuffer = await p12File.arrayBuffer();
      // Browser-safe base64 encoding (Buffer is not available in the browser)
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const p12Base64 = btoa(binary);

      const res = await fetch("/api/kms/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p12Base64, password, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to store certificate");
      }

      setKeyId(data.keyId);
      setSubject(data.certificateSubject);
      onCertificateReady();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Bring Your Own Certificate (BYOC)
      </h3>

      {keyId ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Certificate stored in KMS
            </span>
          </div>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Key ID:</span>{" "}
            <span className="font-mono">{keyId}</span>
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Subject:</span> {subject}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Signer Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              PKCS#12 Certificate (.p12 / .pfx)
            </label>
            <div
              className={`border border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                p12File ? "border-blue-400 bg-blue-50" : "border-gray-300"
              }`}
              onClick={() => inputRef.current?.click()}
            >
              {p12File ? (
                <p className="text-sm text-blue-700 font-medium">{p12File.name}</p>
              ) : (
                <p className="text-sm text-gray-500">Click to select .p12 file</p>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".p12,.pfx"
                className="hidden"
                onChange={(e) => setP12File(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Certificate Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-[#183C95] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isUploading ? "Encrypting & Storing Key…" : "Store Certificate in KMS"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Your private key is encrypted with AES-256-GCM before storage.
          </p>
        </form>
      )}
    </div>
  );
}
