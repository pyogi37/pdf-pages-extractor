const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config({ path: __dirname + "/.env" });
const colors = require("colors");

const port = process.env.PORT;
const path = require("path");

const server = app.listen(port, function (err) {
  if (err) {
    console.log(`Error in running the server: ${err}`);
  }
  console.log(`Server running on port ${port}`.yellow.bold);
});
