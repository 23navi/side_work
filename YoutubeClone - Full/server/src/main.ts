import express from "express";

const app = express();

const server = app.listen(3000, () => {
  console.log("Listening on port 3000");
});

const signals = ["SIGTERM", "SIGINT"];

function gracefulShutDown(signal: string) {
  process.on(signal, async () => {
    console.log(`Signal received of ${signal}`);
    server.close();
    // disconnect from db
    console.log("Exiting");
    process.exit(0);
  });
}

for (let i = 0; i < signals.length; i++) {
  gracefulShutDown(signals[i]);
}
