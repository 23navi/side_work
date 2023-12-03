import mongoose from "mongoose";
import logger from "./logger";

const DB_CONNECTION_STRING =
  process.env.DB_CONNECTION_STRING ||
  "mongodb+srv://Navi2308:Navi2308@cluster0.nxyil8p.mongodb.net/?retryWrites=true&w=majority";

export async function connectToDb() {
  try {
    await mongoose.connect(DB_CONNECTION_STRING);
    logger.info("Connected to DB");
  } catch (e) {
    logger.error(e, "Failed to connect to DB. Exiting");
    process.exit(1); // Exit with error
  }
}

mongoose.connection.on("disconnected", () => {
  console.log("Disconnected from DB");
});

mongoose.connection.on("reconnected", () => {
  console.log("Reconnected after failure");
});

mongoose.connection.on("error",(err)=>{
console.log({err})
})
export async function disconnectFromDb() {
  await mongoose.connection.close();
  logger.info("Disconnect from db");
  return;
}
