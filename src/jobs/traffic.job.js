import { getEnabledSourcesByType } from "../repositories/source.repo.js";
import { isProcessed, markAsProcessed } from "../repositories/processed.repo.js";
import { fetchRSS } from "../services/rss.service.js";
import { generateHash } from "../services/hash.service.js";
import { generatePost } from "../services/ai.service.js";
import { postToFacebook } from "../services/facebook.service.js";

import { incrementPosts, hasRun, updateLastRun } from "../repositories/stats.repo.js";
import { addLog } from "../repositories/logs.repo.js";
import logger from "../utils/logger.js";

export async function runTrafficJob() {
  if (await hasRun("traffic", "daily")) {
    logger.info("🚗 Traffic already posted today. Skipping.");
    return;
  }

  logger.info("🚗 Traffic job started");
  const sources = await getEnabledSourcesByType("traffic");
  if (!sources?.length) return;

  let posted = false;

  for (const source of sources) {
    const items = await fetchRSS(source.url);
    if (!items?.length) continue;

    const top1 = items[0]; // summarize the latest traffic
    const hash = generateHash(`${source.name}|${top1.title}|${new Date().toDateString()}`);
    if (await isProcessed(hash)) continue;

    try {
      const postText = await generatePost({
        type: "traffic",
        title: `Traffic Update Today`,
        content: top1.title,
        location: "London, ON"
      });

      if (postText) {
        await postToFacebook(postText);
        await incrementPosts(1);
        await addLog("info", "Posted daily traffic update");
      }

      await markAsProcessed({
        hash,
        source: source.name,
        title: `Traffic Update Today`,
        type: "traffic",
        publishedAt: new Date(),
        status: "posted"
      });

      posted = true;
      logger.info("✅ Traffic posted today");
    } catch (err) {
      logger.error("❌ Failed posting traffic", { message: err.message });
      await markAsProcessed({
        hash,
        source: source.name,
        title: `Traffic Update Today`,
        type: "traffic",
        publishedAt: new Date(),
        status: "failed"
      });
      await addLog("error", "Failed traffic post", { message: err.message });
    }

    if (posted) break;
  }

  if (posted) await updateLastRun("traffic");
  logger.info("🚗 Traffic job completed");
}
