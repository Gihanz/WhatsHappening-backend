import { runEventsJob } from "../../src/jobs/events.job.js";
import logger from "../../src/utils/logger.js";

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    logger.info("📅 Events cron started");

    if (typeof runEventsJob === "function") {
      await runEventsJob();
    } else {
      throw new Error("runEventsJob not defined");
    }

    logger.info("✅ Events cron completed");
    res.status(200).json({ status: "ok" });
  } catch (err) {
    logger.error("❌ Events cron failed", {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ error: "Events cron failed", details: err.message });
  }
}
