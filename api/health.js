export default async function handler(req, res) {
  try {
    res.status(200).json({
      status: "ok",
      message: "API is healthy",
      service: "london-ai-agent",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Health check failed"
    });
  }
}
