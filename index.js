// You have to write a Node.js based app that is able to respond to emails sent to your Gmail mailbox while you’re out on a vacation.

const fs = require("fs");
const express = require("express");
const { google } = require("googleapis");
require("dotenv").config();

const app = express();
const port = process.env.PORT;

const SCOPE = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://mail.google.com/"
];

const CREDENTIALS_PATH =
  "/media/averek/New Volume/Projects/OpenApp/credentials.json";

app.get("/", (req, res) => {

})
app.listen((port) => {
    console.log(`App listening on port ${port}`);
})