import { runNewsJob } from "../../src/jobs/news.job.js";
import logger from "../../src/utils/logger.js";

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    logger.info("📰 News cron started");

    if (typeof runNewsJob === "function") {
      await runNewsJob();
    } else {
      throw new Error("runNewsJob not defined");
    }

    logger.info("✅ News cron completed");
    res.status(200).json({ status: "ok" });
  } catch (err) {
    logger.error("❌ News cron failed", {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ error: "News cron failed", details: err.message });
  }
}
