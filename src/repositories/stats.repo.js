import { db } from "../config/firebase.js";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION = "stats";
const DOC_DAILY = "daily";

export async function getDailyStats() {
  const doc = await db.collection(COLLECTION).doc(DOC_DAILY).get();
  return doc.exists ? doc.data() : { postsToday: 0, lastRun: null };
}

export async function incrementPosts(count = 1) {
  const docRef = db.collection(COLLECTION).doc(DOC_DAILY);
  await docRef.set(
    {
      postsToday: db.FieldValue.increment(count),
      lastRun: Timestamp.now()
    },
    { merge: true }
  );
}

export async function resetDailyStats() {
  await db.collection(COLLECTION).doc(DOC_DAILY).set({
    postsToday: 0,
    lastRun: Timestamp.now()
  });
}
