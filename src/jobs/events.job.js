import { getEnabledSourcesByType } from "../repositories/source.repo.js";
import { isProcessed, markAsProcessed } from "../repositories/processed.repo.js";
import { fetchRSS } from "../services/rss.service.js";
import { generateHash } from "../services/hash.service.js";
import { generatePost } from "../services/ai.service.js";
import { postToFacebook } from "../services/facebook.service.js";

import { incrementPosts, hasRun, updateLastRun } from "../repositories/stats.repo.js";
import { addLog } from "../repositories/logs.repo.js";
import logger from "../utils/logger.js";

export async function runEventsJob() {
  // Only post once per week
  if (await hasRun("events", "weekly")) {
    logger.info("📅 Events already posted this week. Skipping.");
    return;
  }

  logger.info("📅 Events job started");
  const sources = await getEnabledSourcesByType("events");
  if (!sources?.length) {
    logger.info("No enabled event sources found");
    return;
  }

  let posted = false;

  for (const source of sources) {
    const items = await fetchRSS(source.url);
    if (!items?.length) continue;

    const top5 = items.slice(0, 5);
    const titles = top5.map(i => `• ${i.title}`).join("\n");

    // Generate hash for this weekly post
    const hash = generateHash(`${source.name}|${titles}|${new Date().toDateString()}`);
    if (await isProcessed(hash)) continue;

    try {
      const postText = await generatePost({
        type: "event",
        title: `Top 5 Events This Week`,
        content: titles,
        location: "London, ON"
      });

      if (postText) {
        await postToFacebook(postText);
        await incrementPosts(1); // Update daily stats
        await addLog("info", "Posted top 5 events for this week");
      }

      await markAsProcessed({
        hash,
        source: source.name,
        title: `Top 5 Events This Week`,
        type: "events",
        publishedAt: new Date(),
        status: "posted"
      });

      posted = true;
      logger.info("✅ Events posted for this week");
    } catch (err) {
      logger.error("❌ Failed posting events", { message: err.message });
      await markAsProcessed({
        hash,
        source: source.name,
        title: `Top 5 Events This Week`,
        type: "events",
        publishedAt: new Date(),
        status: "failed"
      });
      await addLog("error", "Failed events post", { message: err.message });
    }

    if (posted) break; // Only one post per week
  }

  if (posted) await updateLastRun("events"); // Mark weekly run
  logger.info("📅 Events job completed");
}
