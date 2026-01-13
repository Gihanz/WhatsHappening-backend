import crypto from "crypto";

export function generateHash(input) {
  if (!input) return null;

  return crypto
    .createHash("sha256")
    .update(String(input).trim().toLowerCase())
    .digest("hex");
}
