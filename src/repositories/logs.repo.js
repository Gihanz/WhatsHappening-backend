import { db } from "../config/firebase.js";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION = "logs";

export async function addLog(level, message, meta = null) {
  const docRef = db.collection(COLLECTION).doc();
  await docRef.set({
    level,
    message,
    meta,
    createdAt: Timestamp.now()
  });
}
