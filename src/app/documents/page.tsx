"use client";

import { useState } from "react";
import Link from "next/link";
import type { DocumentRecord } from "@/types";

export default function DocumentsPage() {
  const [email, setEmail] = useState("");
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const fetchDocuments = async () => {
    if (!email) return;
    setIsLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/documents?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch documents");
      setDocuments(data.documents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };

  const statusColor: Record<DocumentRecord["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800",
    signed: "bg-blue-100 text-blue-800",
    verified: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Documents</h1>
      <p className="text-sm text-gray-500 mb-8">
        View all documents signed with your email address.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#183C95] hover:bg-blue-800 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors"
        >
          {isLoading ? "Loading…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {searched && !isLoading && documents.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📂</p>
          <p className="text-sm">No documents found for this email.</p>
          <Link
            href="/sign"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Sign your first document →
          </Link>
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {doc.filename}
                  </p>
                  <p className="text-xs font-mono text-gray-400 truncate">
                    ID: {doc.id}
                  </p>
                  <p className="text-xs text-gray-500">
                    Signed:{" "}
                    {new Date(doc.signed_at).toLocaleString("en-PH", {
                      timeZone: "Asia/Manila",
                    })}{" "}
                    PHT
                  </p>
                  <p className="text-xs text-gray-500">
                    Certificate: {doc.certificate_subject}
                  </p>
                  <p className="text-xs font-mono text-gray-400 truncate">
                    Hash: {doc.original_hash.slice(0, 20)}…
                  </p>
                </div>
                <div className="shrink-0 space-y-2 text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      statusColor[doc.status]
                    }`}
                  >
                    {doc.status}
                  </span>
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/verify?id=${doc.id}`}
                      className="block text-xs text-blue-600 hover:underline"
                    >
                      Verify →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
