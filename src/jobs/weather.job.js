import { getEnabledSourcesByType } from "../repositories/source.repo.js";
import { isProcessed, markAsProcessed } from "../repositories/processed.repo.js";
import { fetchRSS } from "../services/rss.service.js";
import { generateHash } from "../services/hash.service.js";
import { generatePost } from "../services/ai.service.js";
import { postToFacebook } from "../services/facebook.service.js";

import { incrementPosts, hasRun, updateLastRun } from "../repositories/stats.repo.js";
import { addLog } from "../repositories/logs.repo.js";
import logger from "../utils/logger.js";

export async function runWeatherJob() {
  if (await hasRun("weather", "daily")) {
    logger.info("🌦️ Weather already posted today. Skipping.");
    return;
  }

  logger.info("🌦️ Weather job started");
  const sources = await getEnabledSourcesByType("weather");
  if (!sources?.length) return;

  let posted = false;

  for (const source of sources) {
    const items = await fetchRSS(source.url);
    if (!items?.length) continue;

    const top1 = items[0]; // only the latest item
    const hash = generateHash(`${source.name}|${top1.title}|${new Date().toDateString()}`);
    if (await isProcessed(hash)) continue;

    try {
      const postText = await generatePost({
        type: "weather",
        title: `Weather Update Today`,
        content: top1.title,
        location: "London, ON"
      });

      if (postText) {
        await postToFacebook(postText);
        await incrementPosts(1);
        await addLog("info", "Posted daily weather update");
      }

      await markAsProcessed({
        hash,
        source: source.name,
        title: `Weather Update Today`,
        type: "weather",
        publishedAt: new Date(),
        status: "posted"
      });

      posted = true;
      logger.info("✅ Weather posted today");
    } catch (err) {
      logger.error("❌ Failed posting weather", { message: err.message });
      await markAsProcessed({
        hash,
        source: source.name,
        title: `Weather Update Today`,
        type: "weather",
        publishedAt: new Date(),
        status: "failed"
      });
      await addLog("error", "Failed weather post", { message: err.message });
    }

    if (posted) break;
  }

  if (posted) await updateLastRun("weather");
  logger.info("🌦️ Weather job completed");
}
