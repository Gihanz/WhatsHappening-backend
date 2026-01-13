import { db } from "../config/firebase.js";

const COLLECTION = "sources";

/**
 * Get all enabled sources
 * @returns {Array<Object>}
 */
export async function getAllEnabledSources() {
  const snapshot = await db
    .collection(COLLECTION)
    .where("enabled", "==", true)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Get enabled sources by type
 * @param {"news" | "weather" | "traffic" | "events"} type
 * @returns {Array<Object>}
 */
export async function getEnabledSourcesByType(type) {
  const snapshot = await db
    .collection(COLLECTION)
    .where("enabled", "==", true)
    .where("type", "==", type)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Get a single source by ID
 * Useful for admin/debug tools
 */
export async function getSourceById(sourceId) {
  const doc = await db.collection(COLLECTION).doc(sourceId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}
