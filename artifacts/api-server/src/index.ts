import app from "./app";
import { logger } from "./lib/logger";
import { registerWebhook } from "./lib/telegram";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Auto-register Telegram webhook so it always points to this environment
  // (dev or production) after every restart or deployment.
  registerWebhook().catch((webhookErr) => {
    logger.error({ err: webhookErr }, "Telegram webhook registration failed on startup");
  });
});
