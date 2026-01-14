import { db, FieldValue, Timestamp } from "../config/firebase.js";

const COLLECTION = "stats";
const DOC_DAILY = "daily";
const DOC_WEEKLY = "weekly";

/**
 * Get daily stats
 */
export async function getDailyStats() {
  const doc = await db.collection(COLLECTION).doc(DOC_DAILY).get();
  return doc.exists ? doc.data() : { postsToday: 0, lastRun: null };
}

/**
 * Increment posts counter
 */
export async function incrementPosts(count = 1) {
  const docRef = db.collection(COLLECTION).doc(DOC_DAILY);
  await docRef.set(
    {
      postsToday: FieldValue.increment(count),
      lastRun: Timestamp.now()
    },
    { merge: true }
  );
}

/**
 * Reset daily stats
 */
export async function resetDailyStats() {
  await db.collection(COLLECTION).doc(DOC_DAILY).set({
    postsToday: 0,
    lastRun: Timestamp.now()
  });
}

/**
 * Check if job already ran today/this week
 */
export async function hasRun(jobType = "daily") {
  const docId = jobType === "weekly" ? DOC_WEEKLY : DOC_DAILY;
  const doc = await db.collection(COLLECTION).doc(docId).get();
  if (!doc.exists) return false;

  const lastRun = doc.data()?.lastRun?.toDate?.();
  if (!lastRun) return false;

  const now = new Date();
  if (jobType === "daily") {
    return (
      lastRun.getFullYear() === now.getFullYear() &&
      lastRun.getMonth() === now.getMonth() &&
      lastRun.getDate() === now.getDate()
    );
  } else if (jobType === "weekly") {
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    return lastRun >= lastWeek;
  }
  return false;
}

/**
 * Update last run timestamp
 */
export async function updateLastRun(jobType = "daily") {
  const docId = jobType === "weekly" ? DOC_WEEKLY : DOC_DAILY;
  await db.collection(COLLECTION).doc(docId).set(
    {
      lastRun: Timestamp.now()
    },
    { merge: true }
  );
}
