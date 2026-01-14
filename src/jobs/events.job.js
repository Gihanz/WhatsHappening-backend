import { getEnabledSourcesByType } from "../repositories/source.repo.js";
import { isProcessed, markAsProcessed } from "../repositories/processed.repo.js";

import { fetchRSS } from "../services/rss.service.js";
import { generateHash } from "../services/hash.service.js";
import { generatePost } from "../services/ai.service.js";
import { postToFacebook } from "../services/facebook.service.js";

import { incrementPosts } from "../repositories/stats.repo.js";
import { addLog } from "../repositories/logs.repo.js";

import logger from "../utils/logger.js";

export async function runEventsJob() {
  logger.info("📅 Events job started");

  const sources = await getEnabledSourcesByType("events");
  if (!sources?.length) {
    logger.info("No enabled event sources found");
    return;
  }

  for (const source of sources) {
    logger.info(`Processing source: ${source.name}`);

    const items = await fetchRSS(source.url);
    if (!items?.length) {
      logger.info(`No items found for source: ${source.name}`);
      continue;
    }

    for (const item of items) {
      const hash = generateHash(`${source.name}|${item.title}|${item.publishedAt}`);

      try {
        if (await isProcessed(hash)) {
          logger.debug(`Skipped duplicate: ${item.title}`);
          continue;
        }

        // Generate AI post
        let postText;
        try {
          postText = await generatePost({
            type: "event",
            title: item.title,
            content: item.content,
            location: "London, ON"
          });
        } catch (aiErr) {
          logger.error(`OpenAI post generation failed for: ${item.title}`, { message: aiErr.message });
          await markAsProcessed({
            hash,
            source: source.name,
            title: item.title,
            type: "events",
            publishedAt: item.publishedAt,
            status: "failed"
          });
          await addLog("error", `AI generation failed: ${item.title}`, { message: aiErr.message });
          continue; // skip posting
        }

        // Post to Facebook
        if (postText) {
          try {
            await postToFacebook(postText, item.link);
            await incrementPosts(1);
            await addLog("info", `Posted event: ${item.title}`);
            logger.info(`✅ Event posted: ${item.title}`);

            await markAsProcessed({
              hash,
              source: source.name,
              title: item.title,
              type: "events",
              publishedAt: item.publishedAt,
              status: "posted"
            });
          } catch (fbErr) {
            logger.error(`Facebook post failed: ${item.title}`, { message: fbErr.message });
            await markAsProcessed({
              hash,
              source: source.name,
              title: item.title,
              type: "events",
              publishedAt: item.publishedAt,
              status: "failed"
            });
            await addLog("error", `Facebook post failed: ${item.title}`, { message: fbErr.message });
          }
        }
      } catch (err) {
        // Catch-all for unexpected errors
        logger.error(`Unexpected error for item: ${item.title}`, { message: err.message });
        await markAsProcessed({
          hash,
          source: source.name,
          title: item.title,
          type: "events",
          publishedAt: item.publishedAt,
          status: "failed"
        });
        await addLog("error", `Unexpected error: ${item.title}`, { message: err.message });
      }
    }
  }

  logger.info("📅 Events job completed");
}
