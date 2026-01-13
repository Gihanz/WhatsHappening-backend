import { runWeatherJob } from "../../src/jobs/weather.job.js";
import logger from "../../src/utils/logger.js";

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    logger.info("🌦️ Weather cron started");

    if (typeof runWeatherJob === "function") {
      await runWeatherJob();
    } else {
      throw new Error("runWeatherJob not defined");
    }

    logger.info("✅ Weather cron completed");
    res.status(200).json({ status: "ok" });
  } catch (err) {
    logger.error("❌ Weather cron failed", {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ error: "Weather cron failed", details: err.message });
  }
}
