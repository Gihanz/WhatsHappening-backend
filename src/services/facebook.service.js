import fetch from "node-fetch";

const pageId = process.env.FACEBOOK_PAGE_ID;
const pageAccessToken = process.env.FACEBOOK_PAGE_TOKEN;

if (!pageId || !pageAccessToken) {
  throw new Error("Facebook credentials missing or invalid in environment variables");
}

export async function postToFacebook(message, link = null) {
  if (!message) {
    throw new Error("Empty Facebook message");
  }

  const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;

  const body = new URLSearchParams({
    message,
    access_token: pageAccessToken
  });

  if (link) body.append("link", link);

  const res = await fetch(url, { method: "POST", body });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Facebook API failed: ${data?.error?.message || "Unknown error"}`);
  }

  return data;
}
