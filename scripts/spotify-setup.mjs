#!/usr/bin/env node
// One-time helper to mint the SPOTIFY_REFRESH_TOKEN for the Listening page.
//
// 1. Create an app at https://developer.spotify.com/dashboard (any name).
//    Add redirect URI: http://127.0.0.1:8888/callback
// 2. Run: SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/spotify-setup.mjs
// 3. Approve in the browser tab that opens; the refresh token prints here.
// 4. Put all three values in .env.local (and Vercel env) per .env.example.

import { createServer } from "node:http";
import { exec } from "node:child_process";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPES = "user-read-currently-playing user-read-recently-played user-top-read";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET env vars first.");
  process.exit(1);
}

const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
authorizeUrl.search = new URLSearchParams({
  response_type: "code",
  client_id: CLIENT_ID,
  scope: SCOPES,
  redirect_uri: REDIRECT_URI,
}).toString();

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:8888");
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("Missing code");
    return;
  }
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  const data = await tokenRes.json();
  if (!data.refresh_token) {
    res.writeHead(500).end("Token exchange failed; see terminal.");
    console.error("Token exchange failed:", data);
    process.exit(1);
  }
  res.writeHead(200, { "Content-Type": "text/plain" }).end("Done. Return to the terminal.");
  console.log("\nSPOTIFY_REFRESH_TOKEN=" + data.refresh_token + "\n");
  console.log("Add it to .env.local and the Vercel project env, then re-deploy.");
  server.close();
  process.exit(0);
});

server.listen(8888, () => {
  console.log("Opening Spotify authorization page…\n" + authorizeUrl.toString());
  if (!process.env.SPOTIFY_SETUP_NO_OPEN) exec(`open "${authorizeUrl.toString()}"`);
});
