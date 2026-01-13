import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000
});

/**
 * Fetch RSS items from a source
 * @param {string} url
 */
export async function fetchRSS(url) {
  try {
    const feed = await parser.parseURL(url);

    return feed.items.map(item => ({
      title: item.title || "",
      link: item.link || "",
      content: item.contentSnippet || item.content || "",
      publishedAt: item.isoDate || item.pubDate || null
    }));
  } catch (err) {
    console.error("RSS fetch failed:", url, err.message);
    return [];
  }
}
