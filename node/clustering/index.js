const express = require("express");
const app = express();

app.get("/", async (req, res) => {
  const resp = doWork3();
  console.log("Doing work in /");
  res.send(resp);
});

app.listen(4000);

function doWork(duration) {
  const start = Date.now();
  while (duration > Date.now() - start) {
    // do nothing
  }
  console.log("Work done");
  return "work done";
}

async function doWork2() {
  return new Promise((resolve, reject) => {
    return resolve(doWork(5000));
  });
}

async function doWork3() {
  return new Promise((resolve, reject) => {
    return resolve(doWork2());
  });
}
