import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

const CREDENTIALS_PATH = path.join('./credentials.json');
const TOKEN_PATH = path.join('./token.json');

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

// Create OAuth2 client
export async function getOAuthClient() {
  const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, 'utf8'));
  const { client_id, client_secret, redirect_uris } = credentials.web;

  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

// Save token to disk
export async function saveToken(token) {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(token));
}

// Load token if exists
export async function loadToken(oAuth2Client) {
  try {
    const token = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return true;
  } catch (err) {
    return false;
  }
}
export async function authorize() {
  return getOAuthClient(); // or whatever logic you want
}
