const path = require("path");
const express = require("express");
const helmet = require("helmet");

// Create the server
const app = express();
app.use(helmet());

// Define pass for express config
const publicDirectoryPath = path.join(__dirname, "../public");

// Setup static dir to serve
app.use(express.static(publicDirectoryPath));

module.exports = app;
