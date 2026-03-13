let inMemoryCounter = 0;

export function generateRFQNumber(companyId: string): string {
  // Simple, deterministic-ish RFQ number generator.
  // In production, you might replace this with a company-scoped counter collection.
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  inMemoryCounter += 1;
  const seq = String(inMemoryCounter).padStart(4, "0");
  return `RFQ-${y}${m}${d}-${seq}`;
}

