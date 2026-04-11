// Simulated verification API route
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const { documentHash, signatureId } = req.body;

  // Simulate authentic verification (always passes in MVP demo)
  return res.status(200).json({
    success: true,
    authentic: true,
    signatureId,
    documentHash,
    verifiedAt: new Date().toISOString(),
    signerName: "Demo User",
    signerEmail: "demo@lawgda.example.com",
    certificateIssuer: "Lawgda Demo CA",
    certificateValid: true,
    hashMatch: true,
    message: "Document integrity verified. No tampering detected.",
  });
}
