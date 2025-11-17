import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import {checkIfAlreadyDone} from './database.js'
// Paths to your OAuth credentials and token
const TOKEN_PATH = path.join('./token.json');
const CREDENTIALS_PATH = path.join('./credentials.json');

// Gmail read-only scope
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Helper: decode base64url (used in Gmail API)
function decodeBase64Url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(str, 'base64').toString('utf8');
}

// Create OAuth2 client and set credentials
async function getOAuthClient() {
  const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, 'utf8'));
  const { client_id, client_secret, redirect_uris } = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const token = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);

  return oAuth2Client;
}

// Read all emails and extract their text content
async function getAllEmailsText() {
  const auth = await getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });

  let allText = ''; // variable to store everything

  try {
    // List messages
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10, // you can increase this if needed
    });

    const messages = res.data.messages || [];

    for (const msg of messages) {
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full', // get full payload
      });

      const payload = message.data.payload;

      // Gmail messages can have multiple parts
      function getTextFromParts(parts) {
        let text = '';
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            text += decodeBase64Url(part.body.data) + '\n';
          } else if (part.parts) {
            text += getTextFromParts(part.parts);
          }
        }
        return text;
      }

      let emailText = '';
      //if(checkIfAlreadyDone())
      if (payload.parts) {
        emailText = getTextFromParts(payload.parts);
      } else if (payload.body?.data) {
        emailText = decodeBase64Url(payload.body.data);
      }

      allText += `\n--- EMAIL ---\n${emailText}`;
    }

    console.log(allText); // everything in one variable
    return allText;
  } catch (err) {
    console.error('Error fetching emails:', err);
  }
}

// Run
getAllEmailsText();
