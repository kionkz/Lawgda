export interface DocumentRecord {
  id: string;
  filename: string;
  original_hash: string;
  signature: string;
  signer_email: string;
  certificate_subject: string;
  signed_at: string;
  signed_document_path: string;
  original_document_path: string;
  status: "pending" | "signed" | "verified" | "failed";
}

export interface SigningResult {
  documentId: string;
  signedPdfBase64: string;
  signature: string;
  hash: string;
  qrCodeData: string;
  signedAt: string;
}

export interface VerificationResult {
  isValid: boolean;
  documentId: string;
  filename: string;
  signerEmail: string;
  certificateSubject: string;
  signedAt: string;
  hashMatch: boolean;
  signatureValid: boolean;
  message: string;
}

export interface KMSStoreRequest {
  p12Base64: string;
  password: string;
  email: string;
}

export interface KMSStoreResponse {
  keyId: string;
  certificateSubject: string;
  message: string;
}
