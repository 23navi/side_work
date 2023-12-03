import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import { connectToDb, disconnectFromDb } from "./utils/database";
import logger from "./utils/logger";
import { CORS_ORIGIN } from "./constants";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: CORS_ORIGIN,
  })
);
app.use(helmet());

const server = app.listen(3001, async () => {
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
