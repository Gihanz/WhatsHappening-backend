const isProd = process.env.NODE_ENV === "production";

function format(level, message, meta) {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta && { meta })
  });
}

const logger = {
  info(message, meta) {
    console.log(format("info", message, meta));
  },

  warn(message, meta) {
    console.warn(format("warn", message, meta));
  },

  error(message, meta) {
    console.error(format("error", message, meta));
  },

  debug(message, meta) {
    if (!isProd) {
      console.debug(format("debug", message, meta));
    }
  }
};

export default logger;
