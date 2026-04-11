import { useState, useRef } from "react";

export default function DocumentUploader({ onDocumentReady }) {
  const [fileName, setFileName] = useState(null);
  const [hash, setHash] = useState(null);
  const [hashing, setHashing] = useState(false);
  const fileRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setHash(null);
    setHashing(true);
    onDocumentReady(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setHash(hashHex);
      onDocumentReady({ file, hash: hashHex });
    } catch {
      setHash("error-computing-hash");
    } finally {
      setHashing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <div className="text-4xl mb-2">📄</div>
        <p className="text-blue-600 font-medium">
          {fileName ? fileName : "Click to select a PDF document"}
        </p>
        <p className="text-sm text-gray-400 mt-1">Accepts .pdf files</p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {hashing && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <svg
            className="animate-spin h-5 w-5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
          <span className="text-blue-700 text-sm font-medium">
            Computing SHA-256 hash client-side…
          </span>
        </div>
      )}

      {hash && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-lg">✅</span>
            <span className="text-green-800 font-semibold text-sm">
              SHA-256 Hash Computed (Client-Side)
            </span>
          </div>
          <p className="text-xs font-mono text-gray-600 break-all bg-white border border-green-100 rounded p-2 mt-2">
            {hash}
          </p>
          <p className="text-xs text-gray-400 italic">
            Document fingerprint generated in browser — never leaves your device
            unverified.
          </p>
        </div>
      )}
    </div>
  );
}
