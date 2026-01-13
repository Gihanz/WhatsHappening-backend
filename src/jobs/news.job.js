import { getEnabledSourcesByType } from "../repositories/source.repo.js";
import { isProcessed, markAsProcessed } from "../repositories/processed.repo.js";

import { fetchRSS } from "../services/rss.service.js";
import { generateHash } from "../services/hash.service.js";
import { generatePost } from "../services/ai.service.js";
import { postToFacebook } from "../services/facebook.service.js";

import { incrementPosts } from "../repositories/stats.repo.js";
import { addLog } from "../repositories/logs.repo.js";

import logger from "../utils/logger.js";

export async function runNewsJob() {
  logger.info("📰 News job started");

  const sources = await getEnabledSourcesByType("news");

  if (!sources?.length) {
    logger.info("No enabled news sources found");
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

      if (await isProcessed(hash)) {
        logger.debug(`Skipped duplicate: ${item.title}`);
        continue;
      }

      try {
        const postText = await generatePost({
          type: "news",
          title: item.title,
          content: item.content,
          location: "London, ON"
        });

        if (postText) {
          await postToFacebook(postText, item.link);
          await incrementPosts(1);
          await addLog("info", `Posted news: ${item.title}`);
        }

        await markAsProcessed({
          hash,
          source: source.name,
          title: item.title,
          type: "news",
          publishedAt: item.publishedAt,
          status: "posted"
        });

        logger.info(`✅ News posted: ${item.title}`);
      } catch (err) {
        logger.error(`❌ Failed posting news: ${item.title}`, {
          message: err.message,
          stack: err.stack
        });

        await markAsProcessed({
          hash,
          source: source.name,
          title: item.title,
          type: "news",
          publishedAt: item.publishedAt,
          status: "failed"
        });

        await addLog("error", `Failed news post: ${item.title}`, {
          message: err.message
        });
      }
    }
  }

  logger.info("📰 News job completed");
}
