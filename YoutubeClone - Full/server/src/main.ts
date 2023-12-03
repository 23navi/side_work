import express from "express";
import { connectToDb, disconnectFromDb } from "./utils/database";
import logger from "./utils/logger";

const app = express();

const server = app.listen(3000, async () => {
  await connectToDb();
  logger.info("Listening on port 3000");
});

const signals = ["SIGTERM", "SIGINT"];

function gracefulShutDown(signal: string) {
  process.on(signal, async () => {
    logger.info(`Signal received of ${signal}`);
    server.close();
    // disconnect from db
    await disconnectFromDb();
    logger.info("Exiting");
    process.exit(0);
  });
}

for (let i = 0; i < signals.length; i++) {
  gracefulShutDown(signals[i]);
}
