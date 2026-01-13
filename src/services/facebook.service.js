import fetch from "node-fetch";
import { db } from "../config/firebase.js";

async function getFacebookSettings() {
  const doc = await db.collection("settings").doc("facebook").get();

  if (!doc.exists) {
    throw new Error("Facebook settings missing");
  }

  const { pageId, pageAccessToken } = doc.data();

  if (!pageId || !pageAccessToken) {
    throw new Error("Facebook credentials invalid");
  }

  return { pageId, pageAccessToken };
}

export async function postToFacebook(message, link = null) {
  if (!message) {
    throw new Error("Empty Facebook message");
  }

  const { pageId, pageAccessToken } = await getFacebookSettings();

  const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;

  const body = new URLSearchParams({
    message,
    access_token: pageAccessToken
  });

  if (link) body.append("link", link);

  const res = await fetch(url, { method: "POST", body });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Facebook API failed: ${data?.error?.message || "Unknown error"}`
    );
  }

  return data;
}
