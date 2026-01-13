import { db } from "../config/firebase.js";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION = "processed_items";

/**
 * Check if an item is already processed (posted or skipped)
 * @param {string} hash - Unique hash for the item
 * @returns {boolean}
 */
export async function isProcessed(hash) {
  const docRef = db.collection(COLLECTION).doc(hash);
  const doc = await docRef.get();
  return doc.exists;
}

/**
 * Mark an item as processed
 * @param {Object} data
 * @param {string} data.hash
 * @param {string} data.source
 * @param {string} data.title
 * @param {string} data.type - news | weather | traffic | events
 * @param {string} data.publishedAt - ISO string
 * @param {string} data.status - posted | skipped | failed
 */
export async function markAsProcessed({
  hash,
  source,
  title,
  type,
  publishedAt,
  status = "posted"
}) {
  const docRef = db.collection(COLLECTION).doc(hash);

  await docRef.set({
    source,
    title,
    type,
    status,
    publishedAt: publishedAt ? new Date(publishedAt) : null,
    postedAt: Timestamp.now()
  });
}

/**
 * Optional: Cleanup old processed items (e.g. older than 30 days)
 * Run manually or via admin task
 */
export async function cleanupProcessedItems(days = 30) {
  const cutoff = Timestamp.fromDate(
    new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  );

  const snapshot = await db
    .collection(COLLECTION)
    .where("postedAt", "<", cutoff)
    .get();

  const batch = db.batch();
  snapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  return snapshot.size;
}
