import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Lawgda – Secure Digital Signing & Verification",
  description:
    "Lawgda is a legal document management system for secure electronic evidence. " +
    "Upload, sign, and verify PDF documents using client-side SHA-256 hashing, " +
    "AES-256-GCM KMS, and RSA-SHA256 digital signatures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-[#183C95] text-blue-100 text-xs text-center py-3">
          Lawgda © {new Date().getFullYear()} · Compliant with RA 8792, RA 10173
          (Data Privacy Act) · Privacy by Design
        </footer>
      </body>
    </html>
  );
}
