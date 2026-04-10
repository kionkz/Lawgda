/**
 * PDF utilities – appended certificate model.
 *
 * The original PDF is never mutated. Instead, a separate signature page is
 * generated and appended, creating a new combined document. The signature page
 * contains:
 *   - Document metadata (filename, hash, signer, timestamp)
 *   - A dynamic QR code that encodes the verification URL
 *   - Human-readable signature details
 */
import { PDFDocument, rgb, StandardFonts, PDFPage } from "pdf-lib";
import QRCode from "qrcode";

export interface SignaturePageOptions {
  filename: string;
  sha256Hash: string;
  signature: string;
  signerEmail: string;
  certificateSubject: string;
  signedAt: string;
  documentId: string;
  verificationBaseUrl: string;
}

/**
 * Append a signature page to the original PDF bytes.
 *
 * @param originalPdfBytes  Raw bytes of the original document (unmodified).
 * @param opts              Metadata for the signature page.
 * @returns Combined PDF bytes (original pages + signature page).
 */
export async function appendSignaturePage(
  originalPdfBytes: Uint8Array,
  opts: SignaturePageOptions
): Promise<Uint8Array> {
  // Load the original PDF
  const originalDoc = await PDFDocument.load(originalPdfBytes);

  // Create a new document to hold the combined output
  const combinedDoc = await PDFDocument.create();

  // Copy all original pages into the combined document
  const copiedPages = await combinedDoc.copyPages(
    originalDoc,
    originalDoc.getPageIndices()
  );
  for (const page of copiedPages) {
    combinedDoc.addPage(page);
  }

  // Generate QR code PNG data URL encoding the verification URL
  const verificationUrl = `${opts.verificationBaseUrl}/verify?id=${opts.documentId}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 150,
    margin: 1,
  });
  const qrBase64 = qrDataUrl.split(",")[1];
  const qrImageBytes = Uint8Array.from(Buffer.from(qrBase64, "base64"));
  const qrImage = await combinedDoc.embedPng(qrImageBytes);

  // Add the signature page
  const sigPage = combinedDoc.addPage([595.28, 841.89]); // A4
  await renderSignaturePage(combinedDoc, sigPage, opts, qrImage, verificationUrl);

  return combinedDoc.save();
}

/**
 * Render the signature page content onto the given blank page.
 */
async function renderSignaturePage(
  doc: PDFDocument,
  page: PDFPage,
  opts: SignaturePageOptions,
  qrImage: Awaited<ReturnType<PDFDocument["embedPng"]>>,
  verificationUrl: string
): Promise<void> {
  const { width, height } = page.getSize();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const primaryBlue = rgb(0.094, 0.302, 0.584); // #183C95
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const borderGray = rgb(0.85, 0.85, 0.85);

  // Header banner
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width,
    height: 80,
    color: primaryBlue,
  });

  page.drawText("LAWGDA", {
    x: 40,
    y: height - 50,
    size: 28,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("Secure Electronic Evidence Management", {
    x: 40,
    y: height - 68,
    size: 11,
    font: helvetica,
    color: rgb(0.8, 0.88, 1),
  });

  page.drawText("DIGITAL SIGNATURE CERTIFICATE", {
    x: width - 280,
    y: height - 45,
    size: 13,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  // Divider
  page.drawLine({
    start: { x: 40, y: height - 100 },
    end: { x: width - 40, y: height - 100 },
    thickness: 1,
    color: borderGray,
  });

  // Section: Document information
  let y = height - 130;
  const labelX = 40;
  const valueX = 200;
  const rowGap = 24;

  page.drawText("DOCUMENT INFORMATION", {
    x: labelX,
    y,
    size: 10,
    font: helveticaBold,
    color: primaryBlue,
  });

  y -= rowGap;

  const fields: [string, string][] = [
    ["Filename:", opts.filename],
    ["Document ID:", opts.documentId],
    ["SHA-256 Hash:", truncate(opts.sha256Hash, 52)],
    ["Signed At:", new Date(opts.signedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) + " PHT"],
    ["Signer Email:", opts.signerEmail],
    ["Certificate Subject:", truncate(opts.certificateSubject, 52)],
  ];

  for (const [label, value] of fields) {
    page.drawText(label, {
      x: labelX,
      y,
      size: 9,
      font: helveticaBold,
      color: darkGray,
    });
    page.drawText(value, {
      x: valueX,
      y,
      size: 9,
      font: helvetica,
      color: darkGray,
    });
    y -= rowGap;
  }

  // Divider
  page.drawLine({
    start: { x: 40, y: y - 10 },
    end: { x: width - 40, y: y - 10 },
    thickness: 0.5,
    color: borderGray,
  });

  y -= 30;

  // Section: Digital Signature
  page.drawText("DIGITAL SIGNATURE (RSA-SHA256)", {
    x: labelX,
    y,
    size: 10,
    font: helveticaBold,
    color: primaryBlue,
  });

  y -= 16;

  // Wrap signature into lines of ~80 chars
  const sigLines = wrapText(opts.signature, 80);
  for (const line of sigLines.slice(0, 6)) {
    page.drawText(line, {
      x: labelX,
      y,
      size: 7,
      font: helvetica,
      color: lightGray,
    });
    y -= 12;
  }

  // QR code section (right side)
  const qrSize = 130;
  const qrX = width - qrSize - 50;
  const qrY = height - 340;

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  page.drawText("Scan to Verify", {
    x: qrX + 20,
    y: qrY - 14,
    size: 9,
    font: helveticaBold,
    color: darkGray,
  });

  // Verification URL below QR
  const urlLines = wrapText(verificationUrl, 40);
  let urlY = qrY - 28;
  for (const line of urlLines) {
    page.drawText(line, {
      x: qrX,
      y: urlY,
      size: 7,
      font: helvetica,
      color: lightGray,
    });
    urlY -= 10;
  }

  // Footer
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: 50,
    color: rgb(0.95, 0.95, 0.97),
  });

  page.drawText(
    "This document was digitally signed using Lawgda. " +
      "Compliant with RA 8792 (E-Commerce Act) and RA 10173 (Data Privacy Act).",
    {
      x: 40,
      y: 28,
      size: 7.5,
      font: helvetica,
      color: lightGray,
    }
  );

  page.drawText(`Verified at: ${verificationUrl}`, {
    x: 40,
    y: 14,
    size: 7.5,
    font: helvetica,
    color: lightGray,
  });
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

function wrapText(text: string, maxChars: number): string[] {
  const result: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    result.push(remaining.slice(0, maxChars));
    remaining = remaining.slice(maxChars);
  }
  return result;
}
