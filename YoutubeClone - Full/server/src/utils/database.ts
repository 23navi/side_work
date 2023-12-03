import mongoose from "mongoose";
import logger from "./logger";

const DB_CONNECTION_STRING =
  process.env.DB_CONNECTION_STRING || "mongodb://localhost:27017/youtube-clone";

export async function connectToDb() {
  try {
    await mongoose.connect(DB_CONNECTION_STRING);
    logger.info("Connected to DB");
  } catch (e) {
    logger.error(e, "Failed to connect to DB. Exiting");
    process.exit(1); // Exit with error
  }
}

export async function disconnectFromDb() {
  await mongoose.connection.close();
  logger.info("Disconnect from db");
  return;
}
