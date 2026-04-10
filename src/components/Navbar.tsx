"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-[#183C95] text-white px-6 py-4 flex items-center justify-between shadow-md">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl font-bold tracking-tight">LAWGDA</span>
        <span className="text-xs text-blue-200 hidden sm:block">
          Secure Electronic Evidence
        </span>
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/sign" className="hover:text-blue-200 transition-colors">
          Sign Document
        </Link>
        <Link href="/verify" className="hover:text-blue-200 transition-colors">
          Verify Document
        </Link>
        <Link href="/documents" className="hover:text-blue-200 transition-colors">
          My Documents
        </Link>
      </div>
    </nav>
  );
}
