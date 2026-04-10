/**
 * Digital signature helpers using node-forge.
 *
 * Supports RSA-SHA256 signing using a private key extracted from a PKCS#12
 * (.p12) file (Bring Your Own Certificate – BYOC).
 */
import forge from "node-forge";

export interface ParsedP12 {
  privateKeyPem: string;
  certificatePem: string;
  certificateSubject: string;
}

/**
 * Parse a PKCS#12 (.p12) file and extract the private key and certificate.
 *
 * @param p12Buffer  Raw bytes of the .p12 file.
 * @param password   Password used to protect the .p12 file.
 */
export function parseP12(p12Buffer: Buffer, password: string): ParsedP12 {
  const p12Der = forge.util.createBuffer(p12Buffer.toString("binary"));
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

  // Extract private key bags
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag =
    keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0] ??
    p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]?.[0];

  if (!keyBag?.key) {
    throw new Error("No private key found in the .p12 file");
  }

  // Extract certificate bags
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  if (!certBag?.cert) {
    throw new Error("No certificate found in the .p12 file");
  }

  const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);
  const certificatePem = forge.pki.certificateToPem(certBag.cert);
  const certificateSubject = certBag.cert.subject.attributes
    .map((attr) => `${attr.shortName}=${attr.value}`)
    .join(", ");

  return { privateKeyPem, certificatePem, certificateSubject };
}

/**
 * Sign a SHA-256 hash (hex string) with an RSA private key (PEM).
 *
 * @returns Base64-encoded RSA-SHA256 signature.
 */
export function signHash(sha256HexHash: string, privateKeyPem: string): string {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const md = forge.md.sha256.create();
  md.update(forge.util.hexToBytes(sha256HexHash));
  const signature = privateKey.sign(md);
  return forge.util.encode64(signature);
}

/**
 * Verify an RSA-SHA256 signature.
 *
 * @param sha256HexHash  The expected SHA-256 hash of the original document.
 * @param signatureBase64 Base64-encoded signature to verify.
 * @param certificatePem  PEM-encoded signer certificate.
 * @returns true if the signature is valid.
 */
export function verifySignature(
  sha256HexHash: string,
  signatureBase64: string,
  certificatePem: string
): boolean {
  try {
    const cert = forge.pki.certificateFromPem(certificatePem);
    const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
    const md = forge.md.sha256.create();
    md.update(forge.util.hexToBytes(sha256HexHash));
    const signatureBytes = forge.util.decode64(signatureBase64);
    return publicKey.verify(md.digest().bytes(), signatureBytes);
  } catch {
    return false;
  }
}
