import { useState, useRef } from "react";

export default function ByocUploader({ onCertReady }) {
  const [certName, setCertName] = useState(null);
  const [password, setPassword] = useState("");
  const [certLoaded, setCertLoaded] = useState(false);
  const fileRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCertName(file.name);
    setCertLoaded(false);
    onCertReady(null);
  }

  function handleLoad() {
    if (!certName || !password) return;
    // Simulate certificate validation
    const certInfo = {
      fileName: certName,
      subject: "CN=Demo User, O=Lawgda Demo, C=PH",
      issuer: "CN=Lawgda Demo CA, O=Lawgda, C=PH",
      validFrom: "2025-01-01",
      validTo: "2027-01-01",
      thumbprint: "3A:9F:C2:11:E4:7B:2D:88:FA:01:CC:55:12:DE:34:A9",
    };
    setCertLoaded(true);
    onCertReady(certInfo);
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <div className="text-3xl mb-2">🔑</div>
        <p className="text-purple-600 font-medium">
          {certName ? certName : "Click to upload your .p12 certificate"}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Bring Your Own Certificate (BYOC)
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".p12,.pfx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {certName && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificate Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setCertLoaded(false);
                onCertReady(null);
              }}
              placeholder="Enter your certificate password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <button
            onClick={handleLoad}
            disabled={!password}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            Load Certificate
          </button>
        </div>
      )}

      {certLoaded && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-purple-600 text-lg">🛡️</span>
            <span className="text-purple-800 font-semibold text-sm">
              Certificate Loaded & Verified
            </span>
          </div>
          <div className="text-xs text-gray-600 space-y-1 bg-white border border-purple-100 rounded p-2">
            <p>
              <span className="font-medium">Subject:</span> CN=Demo User,
              O=Lawgda Demo, C=PH
            </p>
            <p>
              <span className="font-medium">Issuer:</span> CN=Lawgda Demo CA
            </p>
            <p>
              <span className="font-medium">Valid:</span> 2025-01-01 →
              2027-01-01
            </p>
            <p className="font-mono break-all">
              <span className="font-sans font-medium">Thumbprint:</span>{" "}
              3A:9F:C2:11:E4:7B:2D:88:FA:01:CC:55:12:DE:34:A9
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
