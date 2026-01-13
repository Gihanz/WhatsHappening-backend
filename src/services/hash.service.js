import crypto from "crypto";

/**
 * Generate SHA-256 hash for any content
 * @param {string} input
 */
export function generateHash(input) {
  return crypto
    .createHash("sha256")
    .update(input.trim().toLowerCase())
    .digest("hex");
}
