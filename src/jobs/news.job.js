import { getEnabledSourcesByType } from "../repositories/source.repo.js";
import { isProcessed, markAsProcessed } from "../repositories/processed.repo.js";
import { fetchRSS } from "../services/rss.service.js";
import { generateHash } from "../services/hash.service.js";
import { generatePost } from "../services/ai.service.js";
import { postToFacebook } from "../services/facebook.service.js";

import { incrementPosts, hasRun, updateLastRun } from "../repositories/stats.repo.js";
import { addLog } from "../repositories/logs.repo.js";
import logger from "../utils/logger.js";

export async function runNewsJob() {
  if (await hasRun("news", "daily")) {
    logger.info("📰 News already posted today. Skipping.");
    return;
  }

  logger.info("📰 News job started");
  const sources = await getEnabledSourcesByType("news");
  if (!sources?.length) return;

  let posted = false;

  for (const source of sources) {
    const items = await fetchRSS(source.url);
    if (!items?.length) continue;

    const top10 = items.slice(0, 10);
    const titles = top10.map(i => `• ${i.title}`).join("\n");

    const hash = generateHash(`${source.name}|${titles}|${new Date().toDateString()}`);
    if (await isProcessed(hash)) continue;

    try {
      const postText = await generatePost({
        type: "news",
        title: `Top 10 News Today`,
        content: titles,
        location: "London, ON"
      });

      if (postText) {
        await postToFacebook(postText);
        await incrementPosts(1);
        await addLog("info", "Posted top 10 news today");
      }

      await markAsProcessed({
        hash,
        source: source.name,
        title: `Top 10 News Today`,
        type: "news",
        publishedAt: new Date(),
        status: "posted"
      });

      posted = true;
      logger.info("✅ News posted today");
    } catch (err) {
      logger.error("❌ Failed posting news", { message: err.message });
      await markAsProcessed({
        hash,
        source: source.name,
        title: `Top 10 News Today`,
        type: "news",
        publishedAt: new Date(),
        status: "failed"
      });
      await addLog("error", "Failed news post", { message: err.message });
    }

    if (posted) break;
  }

  if (posted) await updateLastRun("news");
  logger.info("📰 News job completed");
}
