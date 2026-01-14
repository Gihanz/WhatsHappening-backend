import { runEventsJob } from "../../src/jobs/events.job.js";
import logger from "../../src/utils/logger.js";

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    logger.info("📅 Events cron started");
    await runEventsJob();
    logger.info("✅ Events cron completed");

    res.status(200).json({ status: "ok", message: "Events cron executed" });
  } catch (err) {
    logger.error("❌ Events cron failed", { message: err.message });
    res.status(500).json({ error: "Events cron failed", details: err.message });
  }
}
