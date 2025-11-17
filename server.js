import express from 'express';
import path from 'path';
import { getOAuthClient, saveToken, loadToken, SCOPES } from './auth.js';

const app = express();
const PORT = 80;

// Serve static files from 'public' folder
app.use(express.static(path.join('./public')));

// Route to start login → redirect to Google
app.get('/login', async (req, res) => {
  const oAuth2 = await getOAuthClient();
  const url = oAuth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  res.redirect(url);  // user goes to Google login
});

// OAuth callback route
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  const oAuth2 = await getOAuthClient();

  try {
    const { tokens } = await oAuth2.getToken(code);
    await saveToken(tokens);   // save for backend API calls
    res.send(`<h2>Login Successful! redirecting to dashboard</h2><script> window.location.href = "http://zzmail.com/dashboard.html"; </script>`);
   
  } catch (err) {
    console.error('Error retrieving access token:', err);
    res.send('<h2>Login Failed.</h2>');
  }
});

// Example protected route to fetch emails
app.get('/emails', async (req, res) => {
  const oAuth2 = await getOAuthClient();
  const hasToken = await loadToken(oAuth2);

  if (!hasToken) return res.status(401).send('Not authenticated');

  const gmail = google.gmail({ version: 'v1', auth: oAuth2 });
  try {
    const result = await gmail.users.messages.list({ userId: 'me', maxResults: 10 });
    res.json(result.data);
  } catch (err) {
    res.status(500).send('Error fetching emails: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}/index.html`);
});
