// Simulated signing API route
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { documentHash, certificateInfo, timestamp } = req.body;

  // Generate a simulated signature
  const simulatedSignature = Buffer.from(
    `LAWGDA-SIG-${documentHash}-${Date.now()}`
  ).toString("base64");

  return res.status(200).json({
    success: true,
    signatureId: `SIG-${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
    signature: simulatedSignature,
    signedAt: timestamp || new Date().toISOString(),
    certificateThumbprint: "3A:9F:C2:11:E4:7B:2D:88:FA:01:CC:55:12:DE:34:A9",
    verificationUrl: `https://lawgda.example.com/verify/${Math.random().toString(36).slice(2, 14)}`,
    message: "Document signed successfully using Appended Certificate Model",
  });
}
