/**
 * One-time Twitch OAuth bootstrap.
 *
 * Run locally to obtain a refresh token (and the broadcaster's numeric user id)
 * for the server-side EventSub proxy:
 *
 *   node --experimental-strip-types scripts/twitch-bootstrap.ts
 *
 * Requires TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_USERNAME in the
 * environment (e.g. via a loaded .env). This file is NOT imported by server.ts,
 * so it never enters the SSR bundle.
 */
import 'dotenv/config';
import { createServer } from 'node:http';

const REDIRECT_URI = 'http://localhost:3000';
const SCOPES = ['moderator:read:followers', 'channel:read:subscriptions', 'bits:read'];

const clientId = process.env['TWITCH_CLIENT_ID'];
const clientSecret = process.env['TWITCH_CLIENT_SECRET'];
const username = process.env['TWITCH_USERNAME'];

if (!clientId || !clientSecret || !username) {
  console.error('Missing TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET or TWITCH_USERNAME in env.');
  process.exit(1);
}

const authorizeUrl =
  'https://id.twitch.tv/oauth2/authorize?' +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
  }).toString();

console.log('\n1. Open this URL in your browser and authorize:\n');
console.log(authorizeUrl);
console.log('\nWaiting for the redirect on http://localhost:3000 ...\n');

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', REDIRECT_URI);
  const code = url.searchParams.get('code');
  if (!code) {
    res.writeHead(400).end('Missing ?code');
    return;
  }

  try {
    const token = await exchangeCode(code);
    const broadcasterId = await resolveUserId(token.access_token);

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Twitch bootstrap complete. You can close this tab and return to the terminal.');

    console.log('\n✅ Success! Add these to your .env:\n');
    console.log(`TWITCH_REFRESH_TOKEN=${token.refresh_token}`);
    console.log(`TWITCH_BROADCASTER_ID=${broadcasterId}`);
    console.log('\n(The server will rotate and persist the refresh token automatically.)\n');
  } catch (err) {
    res.writeHead(500).end('Bootstrap failed; see terminal.');
    console.error('Bootstrap failed:', err);
  } finally {
    server.close();
  }
});

server.listen(3000);

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

async function exchangeCode(code: string): Promise<TokenResponse> {
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
  });
  if (!response.ok) {
    throw new Error(`token exchange failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as TokenResponse;
}

async function resolveUserId(accessToken: string): Promise<string> {
  const response = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username!)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}`, 'Client-Id': clientId! },
    },
  );
  if (!response.ok) {
    throw new Error(`user lookup failed: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as { data: { id: string }[] };
  const id = data.data[0]?.id;
  if (!id) {
    throw new Error(`no user found for login "${username}"`);
  }
  return id;
}
