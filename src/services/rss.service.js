import Parser from "rss-parser";
import logger from "../utils/logger.js";

const parser = new Parser({
  timeout: 10000
});

export async function fetchRSS(url) {
  if (!url) return [];

  try {
    const feed = await parser.parseURL(url);

    if (!feed?.items?.length) return [];

    return feed.items
      .filter(item => item?.title || item?.content || item?.contentSnippet)
      .map(item => ({
        title: item.title?.trim() || "",
        link: item.link || "",
        content:
          item.contentSnippet?.trim() ||
          item.content?.trim() ||
          "",
        publishedAt: item.isoDate || item.pubDate || null
      }));
  } catch (err) {
    logger.error("RSS fetch failed", {
      url,
      error: err.message
    });
    return [];
  }
}
