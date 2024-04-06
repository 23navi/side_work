process.env.UV_THREADPOOL_SIZE = 1;
const crypto = require("crypto");
const https = require("https");
const fs = require("fs");

const start = Date.now();

function doHash() {
  crypto.pbkdf2("a", "b", 10000000, 512, "sha512", () => {
    console.log({ hash: Date.now() - start });
  });
}

function doRequest(sNo) {
  try {
    const res = https.request("https://www.google.com", (res) => {
      res.on("data", () => {});
      res.on("end", () => {
        console.log({ request: Date.now() - start });
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
    });

    req.end();
  } catch (err) {
    console.log("err");
  }
}

fs.readFile("multitask.js", "utf8", () => {
  console.log({ "FS:": Date.now() - start });
});

doHash();
doHash();
doHash();
doHash();

doRequest();
