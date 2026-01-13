import fetch from "node-fetch";
import { db } from "../config/firebase.js";

/**
 * Get Facebook credentials from Firestore
 */
async function getFacebookSettings() {
  const doc = await db.collection("settings").doc("facebook").get();
  if (!doc.exists) {
    throw new Error("Facebook settings not found");
  }
  return doc.data();
}

/**
 * Post message to Facebook Page
 */
export async function postToFacebook(message, link = null) {
  const { pageId, pageAccessToken } = await getFacebookSettings();

  const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;

  const body = new URLSearchParams({
    message,
    access_token: pageAccessToken
  });

  if (link) {
    body.append("link", link);
  }

  const res = await fetch(url, {
    method: "POST",
    body
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Facebook API Error:", data);
    throw new Error("Facebook post failed");
  }

  return data;
}
