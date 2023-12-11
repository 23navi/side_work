require("dotenv").config(); // Env from .env will be available to all the modules
const express = require("express");
const app = express();

app.listen(3000, () => {
  console.log("Listening on port 3000");
  console.log("XXXXXX");
});
