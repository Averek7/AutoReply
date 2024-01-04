// You have to write a Node.js based app that is able to respond to emails sent to your Gmail mailbox while you’re out on a vacation.

const fs = require("fs");
const express = require("express");
const { google } = require("googleapis");
const { authenticate } = require("@google-cloud/local-auth");
require("dotenv").config();

const app = express();
const port = process.env.PORT;

const SCOPE = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://mail.google.com/",
];

const CREDENTIALS_PATH =
  "/media/averek/New Volume/Projects/OpenApp/credentials.json";

const authorize = async () => {
  const auth = await authenticate({
    keyfilePath: CREDENTIALS_PATH,
    scopes: SCOPE,
  });

  const gmail = google.gmail({ version: "v1", auth });

  const response = await gmail.users.labels.list({
    userId: "me",
  });

  console.log(response.data.labels);

  return auth;
};

const getMessages = async (auth) => {
  const gmail = google.gmail({ version: "v1", auth });
  const response = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    q: "is:unread",
  });

  return response.data.messages || [];
};

const changeLabel = async (auth) => {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const response = await gmail.users.labels.create({
      userId: "me",
      requestBody: {
        name: "Auto-Reply",
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      },
    });
    console.log(response.data);
    return response.data.id;
  } catch (error) {
    if (error.code === 409) {
      const response = await gmail.users.labels.list({
        userId: "me",
      });
      const label = response.data.labels.find(
        (label) => label.name === "Auto-Reply"
      );
      return label.id;
    } else {
      throw error;
    }
  }
};

const main = async () => {
  const auth = await authorize();
  const labelId = await changeLabel(auth);
  const gmail = google.gmail({ version: "v1", auth });

  setInterval(async () => {
    const messages = await getMessages(auth);
    if (messages.length) {
      console.log("New messages");
      messages.forEach(async (message) => {
        const response = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
        });
        const mail = response.data;
        console.log(mail);

        const replyMessage = {
          userId: "me",
          resource: {
            raw: Buffer.from(
              `To: ${
                mail.payload.headers.find((header) => header.name === "From")
                  .value
              }\r\n` +
                `Subject: Re: ${
                  mail.payload.headers.find(
                    (header) => header.name === "Subject"
                  ).value
                }\r\n` +
                `Content-Type: text/plain; charset="UTF-8"\r\n` +
                `Content-Transfer-Encoding: 7bit\r\n\r\n` +
                `Thank you for your email. I'm currently on vacation and will reply to you when I return.\r\n`
            ).toString("base64"),
          },
        };

        console.log("Staged to send...");
        await gmail.users.messages.send(replyMessage);
        console.log("Sending...");

        // Add label and move the email
        await gmail.users.messages.modify({
          auth,
          userId: "me",
          id: message.id,
          resource: {
            addLabelIds: [labelId],
            removeLabelIds: ["INBOX"],
          },
        });

        console.log("Sent !");
      });
    } else {
      console.log("No new messages");
    }
  }, Math.floor(Math.random() * (120 - 45 + 1) + 45) * 1000);
};

app.get("/", async (req, res) => {
  main();
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
