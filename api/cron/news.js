import { runNewsJob } from "../../src/jobs/news.job.js";
import logger from "../../src/utils/logger.js";

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    logger.info("📰 News cron started");
    await runNewsJob();
    logger.info("✅ News cron completed");

    res.status(200).json({ status: "ok", message: "News cron executed" });
  } catch (err) {
    logger.error("❌ News cron failed", { message: err.message });
    res.status(500).json({ error: "News cron failed", details: err.message });
  }
}
