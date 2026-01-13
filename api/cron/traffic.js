import { runTrafficJob } from "../../src/jobs/traffic.job.js";
import logger from "../../src/utils/logger.js";

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    logger.info("🚗 Traffic cron started");
    await runTrafficJob();
    logger.info("✅ Traffic cron completed");

    res.status(200).json({ status: "ok" });
  } catch (err) {
    logger.error("❌ Traffic cron failed", err);
    res.status(500).json({ error: "Traffic cron failed" });
  }
}
