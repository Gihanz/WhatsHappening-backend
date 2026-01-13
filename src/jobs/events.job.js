import { getEnabledSourcesByType } from "../repositories/source.repo.js";
import { isProcessed, markAsProcessed } from "../repositories/processed.repo.js";

import { fetchRSS } from "../services/rss.service.js";
import { generateHash } from "../services/hash.service.js";
import { generatePost } from "../services/ai.service.js";
import { postToFacebook } from "../services/facebook.service.js";

import logger from "../utils/logger.js";

/**
 * Run Events Job
 * - Fetch enabled event sources
 * - Read RSS feeds
 * - Deduplicate
 * - Generate AI post
 * - Post to Facebook
 */
export async function runEventsJob() {
  logger.info("📅 Events job started");

  const sources = await getEnabledSourcesByType("events");

  if (!sources.length) {
    logger.info("No enabled event sources found");
    return;
  }

  for (const source of sources) {
    logger.info(`Processing source: ${source.name}`);

    const items = await fetchRSS(source.url);

    for (const item of items) {
      const hashInput = `${source.name}|${item.title}|${item.publishedAt}`;
      const hash = generateHash(hashInput);

      // 🔁 Duplicate check
      if (await isProcessed(hash)) {
        logger.debug(`Skipped duplicate: ${item.title}`);
        continue;
      }

      try {
        // ✍️ AI post generation
        const postText = await generatePost({
          type: "event",
          title: item.title,
          content: item.content,
          location: "London, ON"
        });

        // 📤 Facebook post
        await postToFacebook(postText, item.link);

        // ✅ Mark as processed
        await markAsProcessed({
          hash,
          source: source.name,
          title: item.title,
          type: "events",
          publishedAt: item.publishedAt,
          status: "posted"
        });

        logger.info(`✅ Event posted: ${item.title}`);
      } catch (err) {
        logger.error(`❌ Failed posting event: ${item.title}`, err);

        // Mark as failed (prevents retry loops)
        await markAsProcessed({
          hash,
          source: source.name,
          title: item.title,
          type: "events",
          publishedAt: item.publishedAt,
          status: "failed"
        });
      }
    }
  }

  logger.info("📅 Events job completed");
}
