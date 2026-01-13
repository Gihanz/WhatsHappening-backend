import { runEventsJob } from "../../src/jobs/events.job.js";
import { runNewsJob } from "../../src/jobs/news.job.js";
import { runWeatherJob } from "../../src/jobs/weather.job.js";

import logger from "../../src/utils/logger.js";

export default async function handler(req, res) {
  // Optional: protect endpoint
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  logger.info("🚀 Daily cron started");

  try {
    await runWeatherJob(); // priority alerts first
    await runNewsJob();
    await runEventsJob();

    logger.info("✅ Daily cron completed successfully");
    res.status(200).json({ status: "ok" });
  } catch (err) {
    logger.error("🔥 Cron failed", err);
    res.status(500).json({ error: "Cron execution failed" });
  }
}
