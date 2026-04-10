import Link from "next/link";

export default function Home() {
  const features = [
    {
      icon: "🔒",
      title: "Client-Side SHA-256 Hashing",
      description:
        "Documents are hashed in the browser using the Web Crypto API. Original file bytes never leave your device unprocessed.",
    },
    {
      icon: "🛡️",
      title: "AES-256-GCM Key Management",
      description:
        "Your BYOC private key is encrypted with AES-256-GCM using HKDF-derived keys before storage. Plaintext keys never persist.",
    },
    {
      icon: "✍️",
      title: "RSA-SHA256 Digital Signatures",
      description:
        "Bring Your Own Certificate (.p12 / PKCS#12). The backend orchestrates signing using your KMS-protected private key.",
    },
    {
      icon: "📄",
      title: "Appended Certificate Model",
      description:
        "A separate signature page with a dynamic QR code is appended to your original PDF. The original document is never modified.",
    },
    {
      icon: "🔍",
      title: "Cryptographic Verification",
      description:
        "Re-upload the original to verify: the system re-hashes, compares against the stored hash, and validates the RSA signature.",
    },
    {
      icon: "⚖️",
      title: "Regulatory Compliance",
      description:
        "Designed to adhere to REE, RA 8792 (E-Commerce Act), and RA 10173 (Data Privacy Act) – Privacy by Design.",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Upload PDF Document",
      description:
        "Select your PDF. The browser instantly computes the SHA-256 hash client-side.",
    },
    {
      step: "02",
      title: "Upload Your Certificate (BYOC)",
      description:
        "Provide your .p12 certificate. Lawgda encrypts your private key with AES-256-GCM and stores only the ciphertext.",
    },
    {
      step: "03",
      title: "Sign Document",
      description:
        "The backend retrieves and decrypts your key (in memory only), signs the hash, and generates the combined PDF.",
    },
    {
      step: "04",
      title: "Download Signed Document",
      description:
        "Receive the original PDF with an appended signature page containing a QR code linking to the verification URL.",
    },
    {
      step: "05",
      title: "Verify Authenticity",
      description:
        "Anyone can scan the QR code or re-upload the original to cryptographically verify the document's integrity.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="inline-block bg-blue-100 text-[#183C95] text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest">
          MVP – Secure Digital Signing & Verification
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
          Legal Documents You Can{" "}
          <span className="text-[#183C95]">Trust</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Lawgda is a secure electronic evidence management system that lets you
          digitally sign PDF documents with your own certificate, append a
          tamper-evident signature page, and instantly verify authenticity via QR
          code.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            href="/sign"
            className="bg-[#183C95] hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-sm"
          >
            Sign a Document →
          </Link>
          <Link
            href="/verify"
            className="bg-white hover:bg-gray-50 text-[#183C95] font-semibold px-8 py-3 rounded-lg border border-[#183C95] transition-colors"
          >
            Verify a Document
          </Link>
        </div>
      </section>

      {/* Key Features */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Key Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* User Flow */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          How It Works
        </h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-100 hidden sm:block" />
          <div className="space-y-8">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="w-16 h-16 shrink-0 bg-[#183C95] text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md z-10">
                  {s.step}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-600">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Technology Stack
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
          {[
            { label: "Frontend", value: "Next.js 16 / React 19" },
            { label: "Database", value: "Supabase (PostgreSQL)" },
            { label: "Storage", value: "Supabase Storage" },
            { label: "KMS", value: "AES-256-GCM (HKDF)" },
            { label: "Signing", value: "RSA-SHA256 (BYOC)" },
            { label: "Hashing", value: "SHA-256 (Web Crypto)" },
            { label: "PDF", value: "pdf-lib + QR Code" },
            { label: "Hosting", value: "Vercel" },
          ].map((t) => (
            <div key={t.label} className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {t.label}
              </p>
              <p className="font-medium text-gray-800">{t.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance */}
      <section className="text-center bg-[#183C95] text-white rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-4">Regulatory Compliance</h2>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          {[
            "RA 8792 – E-Commerce Act",
            "RA 10173 – Data Privacy Act",
            "REE (Rules on Electronic Evidence)",
            "Privacy by Design",
          ].map((r) => (
            <span key={r} className="bg-white/20 px-4 py-2 rounded-full">
              {r}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
