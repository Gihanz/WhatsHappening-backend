import { db } from "../config/firebase.js";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION = "processed_items";

export async function isProcessed(hash) {
  const doc = await db.collection(COLLECTION).doc(hash).get();
  return doc.exists && doc.data()?.status === "posted";
}

export async function markAsProcessed({
  hash,
  source,
  title,
  type,
  publishedAt,
  status,
  error = null
}) {
  await db.collection(COLLECTION).doc(hash).set(
    {
      source,
      title,
      type,
      status, // posted | failed | skipped
      error,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      updatedAt: Timestamp.now(),
      ...(status === "posted" && { postedAt: Timestamp.now() })
    },
    { merge: true }
  );
}

export async function cleanupProcessedItems(days = 30) {
  const cutoff = Timestamp.fromDate(
    new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  );

  const snapshot = await db
    .collection(COLLECTION)
    .where("postedAt", "<", cutoff)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  return snapshot.size;
}
