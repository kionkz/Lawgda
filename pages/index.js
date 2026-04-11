import { useState } from "react";
import DocumentUploader from "@/components/DocumentUploader";
import ByocUploader from "@/components/ByocUploader";

// Simple QR-code placeholder rendered as SVG grid
function QrPlaceholder({ value }) {
  // 7x7 fixed pattern for visual representation
  const cells = [
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
    [0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0],
    [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1],
  ];
  const size = 19;
  const cellSize = 8;
  const dim = size * cellSize;
  return (
    <svg
      width={dim}
      height={dim}
      viewBox={`0 0 ${dim} ${dim}`}
      xmlns="http://www.w3.org/2000/svg"
      className="rounded"
    >
      <rect width={dim} height={dim} fill="white" />
      {cells.map((row, r) =>
        row.map((v, c) =>
          v ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#1a1a1a"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [document, setDocument] = useState(null); // { file, hash }
  const [cert, setCert] = useState(null); // cert info object

  const [signing, setSigning] = useState(false);
  const [signResult, setSignResult] = useState(null); // signed doc data

  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  // ── Login ──────────────────────────────────────────────────────────────────
  function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) {
      setLoginError("Please enter your email and password.");
      return;
    }
    setIsLoggedIn(true);
    setLoginError("");
  }

  // ── Sign ───────────────────────────────────────────────────────────────────
  async function handleSign() {
    if (!document || !cert) return;
    setSigning(true);
    setSignResult(null);
    setVerifyResult(null);

    try {
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentHash: document.hash,
          certificateInfo: cert,
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      setSignResult(data);
    } catch {
      setSignResult({ success: false, message: "Signing request failed." });
    } finally {
      setSigning(false);
    }
  }

  // ── Verify ─────────────────────────────────────────────────────────────────
  async function handleVerify() {
    if (!signResult) return;
    setVerifying(true);
    setVerifyResult(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentHash: document.hash,
          signatureId: signResult.signatureId,
        }),
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch {
      setVerifyResult({ authentic: false, message: "Verification failed." });
    } finally {
      setVerifying(false);
    }
  }

  const canSign = !!document && !!cert && !signing;
  const canVerify = !!signResult?.success && !verifying;

  // ── Login screen ───────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white text-3xl mb-4">
              ⚖️
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Lawgda</h1>
            <p className="text-gray-500 text-sm mt-1">
              Secure Legal Document Management
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            {loginError && (
              <p className="text-red-500 text-xs">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
            >
              Sign In to Lawgda
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Protected by AES-256 KMS · Client-side SHA-256 hashing
          </p>
        </div>
      </div>
    );
  }

  // ── Main Dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚖️</span>
          <div>
            <h1 className="text-xl font-bold leading-none">Lawgda</h1>
            <p className="text-indigo-200 text-xs">
              Secure Electronic Evidence System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{email}</p>
            <p className="text-indigo-300 text-xs">Authenticated User</p>
          </div>
          <button
            onClick={() => {
              setIsLoggedIn(false);
              setDocument(null);
              setCert(null);
              setSignResult(null);
              setVerifyResult(null);
            }}
            className="text-xs bg-indigo-500 hover:bg-indigo-400 rounded-lg px-3 py-1.5 transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Progress steps */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs font-medium">
          {[
            { label: "1. Login", done: true },
            { label: "2. Upload Document", done: !!document },
            { label: "3. Upload Certificate (BYOC)", done: !!cert },
            { label: "4. Sign", done: !!signResult?.success },
            { label: "5. Verify", done: !!verifyResult?.authentic },
          ].map((step, i, arr) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full border ${
                  step.done
                    ? "bg-green-100 border-green-300 text-green-700"
                    : "bg-gray-100 border-gray-200 text-gray-400"
                }`}
              >
                {step.done ? "✓ " : ""}
                {step.label}
              </span>
              {i < arr.length - 1 && (
                <span className="text-gray-300">›</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Row 1: Upload panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document Upload */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📄</span>
              <h2 className="text-base font-bold text-gray-800">
                1. Upload Legal Document
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              SHA-256 hash is computed entirely in your browser.
            </p>
            <DocumentUploader onDocumentReady={setDocument} />
          </section>

          {/* BYOC Upload */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🔑</span>
              <h2 className="text-base font-bold text-gray-800">
                2. Bring Your Own Certificate (BYOC)
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Upload your .p12 certificate to bind your identity to the
              document.
            </p>
            <ByocUploader onCertReady={setCert} />
          </section>
        </div>

        {/* Sign button */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span>✍️</span> 3. Sign Document
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Uses the Appended Certificate Model — original PDF is never
                modified.
              </p>
            </div>
            <button
              onClick={handleSign}
              disabled={!canSign}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                canSign
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {signing ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Signing…
                </>
              ) : (
                "Sign Document"
              )}
            </button>
          </div>

          {!canSign && !signResult && (
            <p className="text-xs text-amber-600 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ Upload a PDF document and load your BYOC certificate to enable
              signing.
            </p>
          )}
        </section>

        {/* Signed output */}
        {signResult?.success && (
          <section className="bg-white rounded-2xl shadow-sm border border-green-200 p-6 space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  4. Signed Document Output
                </h2>
                <p className="text-xs text-green-600">
                  Signature ID:{" "}
                  <span className="font-mono">{signResult.signatureId}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original document preview */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  📄 Original Document{" "}
                  <span className="text-xs font-normal text-gray-400">
                    (read-only, unmodified)
                  </span>
                </h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2 min-h-[160px] flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="h-2.5 bg-gray-200 rounded w-4/5" />
                    <div className="h-2.5 bg-gray-200 rounded w-3/5" />
                    <div className="h-2.5 bg-gray-200 rounded w-full" />
                    <div className="h-2.5 bg-gray-200 rounded w-4/5" />
                    <div className="h-2.5 bg-gray-200 rounded w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-full" />
                    <div className="h-2.5 bg-gray-100 rounded w-5/6" />
                  </div>
                  <p className="text-xs text-center text-gray-400 pt-2 font-medium">
                    {document?.file?.name ?? "document.pdf"}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  SHA-256:{" "}
                  <span className="font-mono text-[10px]">
                    {document?.hash?.slice(0, 20)}…
                  </span>
                </p>
              </div>

              {/* Appended signature page */}
              <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50">
                <h3 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                  🖊️ Appended Signature Page{" "}
                  <span className="text-xs font-normal text-indigo-400">
                    (generated separately)
                  </span>
                </h3>
                <div className="bg-white border border-indigo-200 rounded-lg p-4 space-y-3">
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Certificate of Authenticity
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Lawgda — Appended Certificate Model
                    </p>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="text-[10px] text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Signer:</span> {email}
                    </p>
                    <p>
                      <span className="font-medium">Signed At:</span>{" "}
                      {new Date(signResult.signedAt).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-medium">Certificate:</span>{" "}
                      {cert?.thumbprint?.slice(0, 17)}…
                    </p>
                    <p className="font-mono break-all text-[9px] text-gray-400">
                      Hash: {document?.hash?.slice(0, 24)}…
                    </p>
                  </div>
                  <div className="flex justify-center pt-1">
                    <QrPlaceholder value={signResult.verificationUrl} />
                  </div>
                  <p className="text-[9px] text-center text-gray-400">
                    Scan to verify document integrity
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => alert("Simulated: Signed document downloaded.")}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl px-5 py-2 transition-colors"
              >
                ⬇️ Download Signed Document
              </button>
              <button
                onClick={handleVerify}
                disabled={!canVerify}
                className={`flex items-center gap-2 text-sm font-semibold rounded-xl px-5 py-2 transition-all ${
                  canVerify
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {verifying ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Verifying…
                  </>
                ) : (
                  "🔍 Verify Document Integrity"
                )}
              </button>
            </div>
          </section>
        )}

        {/* Verification result */}
        {verifyResult && (
          <section
            className={`rounded-2xl shadow-sm border p-6 ${
              verifyResult.authentic
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">
                {verifyResult.authentic ? "✅" : "❌"}
              </span>
              <div className="flex-1 space-y-3">
                <div>
                  <h2
                    className={`text-lg font-bold ${
                      verifyResult.authentic
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {verifyResult.authentic
                      ? "Document is Authentic"
                      : "Tampering Detected!"}
                  </h2>
                  <p
                    className={`text-sm ${
                      verifyResult.authentic
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {verifyResult.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: "Hash Match",
                      value: verifyResult.hashMatch ? "✓ Pass" : "✗ Fail",
                      ok: verifyResult.hashMatch,
                    },
                    {
                      label: "Certificate Valid",
                      value: verifyResult.certificateValid
                        ? "✓ Valid"
                        : "✗ Invalid",
                      ok: verifyResult.certificateValid,
                    },
                    {
                      label: "Authentic",
                      value: verifyResult.authentic
                        ? "✓ Verified"
                        : "✗ Failed",
                      ok: verifyResult.authentic,
                    },
                  ].map((check) => (
                    <div
                      key={check.label}
                      className={`rounded-lg p-3 text-center text-xs ${
                        check.ok
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      <p className="font-bold text-sm">{check.value}</p>
                      <p className="text-gray-500 mt-0.5">{check.label}</p>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-500 bg-white rounded-lg p-3 border border-gray-100 space-y-1">
                  <p>
                    <span className="font-medium">Signer:</span>{" "}
                    {verifyResult.signerName} ({verifyResult.signerEmail})
                  </p>
                  <p>
                    <span className="font-medium">Verified At:</span>{" "}
                    {new Date(verifyResult.verifiedAt).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Signature ID:</span>{" "}
                    <span className="font-mono">{verifyResult.signatureId}</span>
                  </p>
                  <p>
                    <span className="font-medium">Document Hash:</span>{" "}
                    <span className="font-mono text-[10px]">
                      {verifyResult.documentHash?.slice(0, 32)}…
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 mt-8">
        Lawgda © 2025 · AES-256 KMS · Client-side SHA-256 · Appended
        Certificate Model · BYOC Support
      </footer>
    </div>
  );
}
