#!/usr/bin/env node
// One-time helper to mint the SPOTIFY_REFRESH_TOKEN for the Listening page.
//
// 1. Register http://127.0.0.1:8888/callback in the Spotify dashboard.
// 2. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in the environment.
// 3. Run this script and approve the request in the browser.
// 4. Rerun with --print-token only when the token must be copied into a
//    private secret store. The default output confirms receipt without
//    printing the token.

import { execFile } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const LOOPBACK_HOST = "127.0.0.1";
const DEFAULT_CALLBACK_PORT = 8888;
const DEFAULT_AUTHORIZATION_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_TOKEN_TIMEOUT_MS = 15 * 1000;
const SCOPES = "user-read-currently-playing user-read-recently-played user-top-read";
const GENERIC_ERROR = "Authorization could not be completed.";
const AUTHORIZATION_TIMEOUT_ERROR = "Authorization timed out. Run the setup again.";
const LISTENER_ERROR =
  "Could not start the local callback server. Close any process using the callback port, then try again.";
const args = process.argv.slice(2);
const printToken = args.includes("--print-token");

function numericOption(name, fallback, minimum, maximum) {
  const prefix = `--${name}=`;
  const option = args.find((argument) => argument.startsWith(prefix));
  if (!option) return fallback;
  const value = Number(option.slice(prefix.length));
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    console.error("Invalid Spotify setup option.");
    process.exit(1);
  }
  return value;
}

const callbackPort = numericOption("callback-port", DEFAULT_CALLBACK_PORT, 0, 65_535);
const authorizationTimeoutMs = numericOption(
  "authorization-timeout-ms",
  DEFAULT_AUTHORIZATION_TIMEOUT_MS,
  1,
  2_147_483_647
);
const tokenTimeoutMs = numericOption(
  "token-timeout-ms",
  DEFAULT_TOKEN_TIMEOUT_MS,
  1,
  2_147_483_647
);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET env vars first.");
  process.exit(1);
}

const state = randomBytes(32).toString("hex");
let redirectUri;
let authorizationTimer;
let tokenTimer;
let tokenController;
let callbackStarted = false;

function stateMatches(received) {
  if (typeof received !== "string") return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(state);
  if (receivedBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(receivedBytes, expectedBytes);
}

function onceCallback(callback) {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    callback();
  };
}

function clearAuthorizationTimer() {
  if (authorizationTimer) clearTimeout(authorizationTimer);
  authorizationTimer = undefined;
}

function clearTokenTimer(abort = false) {
  if (tokenTimer) clearTimeout(tokenTimer);
  tokenTimer = undefined;
  if (abort) tokenController?.abort();
  tokenController = undefined;
}

function closeServer(onClosed = () => {}) {
  clearAuthorizationTimer();
  clearTokenTimer(true);
  const done = onceCallback(onClosed);
  if (server.listening) server.close(done);
  else done();
}

function finish(res, status, message, onClosed) {
  const close = onceCallback(() => closeServer(onClosed));
  clearAuthorizationTimer();
  clearTokenTimer();
  res.once("close", close);
  try {
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(message, close);
  } catch {
    close();
  }
}

async function exchangeCode(code) {
  const controller = new AbortController();
  tokenController = controller;
  tokenTimer = setTimeout(() => controller.abort(), tokenTimeoutMs);
  try {
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      signal: controller.signal,
    });
    return { tokenResponse, data: await tokenResponse.json() };
  } finally {
    clearTokenTimer();
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", redirectUri);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }

  if (callbackStarted) {
    res.writeHead(409, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(GENERIC_ERROR);
    return;
  }
  callbackStarted = true;
  clearAuthorizationTimer();

  const receivedState = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!stateMatches(receivedState) || !code || url.searchParams.has("error")) {
    finish(res, 400, GENERIC_ERROR, () => {
      console.error(GENERIC_ERROR);
      process.exitCode = 1;
    });
    return;
  }

  try {
    const { tokenResponse, data } = await exchangeCode(code);
    if (!tokenResponse.ok || typeof data.refresh_token !== "string") {
      finish(res, 502, GENERIC_ERROR, () => {
        console.error(GENERIC_ERROR);
        process.exitCode = 1;
      });
      return;
    }

    finish(res, 200, "Refresh token received. Return to the terminal.", () => {
      console.log("\nRefresh token received.");
      if (printToken) console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`);
      console.log("Store it in .env.local and the Vercel project environment, then redeploy.");
    });
  } catch {
    finish(res, 502, GENERIC_ERROR, () => {
      console.error(GENERIC_ERROR);
      process.exitCode = 1;
    });
  }
});

server.once("error", () => {
  console.error(LISTENER_ERROR);
  process.exitCode = 1;
  closeServer();
});

server.listen(callbackPort, LOOPBACK_HOST, () => {
  const address = server.address();
  if (!address || typeof address === "string") {
    console.error(LISTENER_ERROR);
    process.exitCode = 1;
    closeServer();
    return;
  }

  redirectUri = `http://${LOOPBACK_HOST}:${address.port}/callback`;
  const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
  authorizeUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
  }).toString();

  authorizationTimer = setTimeout(() => {
    callbackStarted = true;
    console.error(AUTHORIZATION_TIMEOUT_ERROR);
    process.exitCode = 1;
    closeServer();
  }, authorizationTimeoutMs);

  console.log("Opening Spotify authorization page…\n" + authorizeUrl.toString());
  if (!process.env.SPOTIFY_SETUP_NO_OPEN) {
    execFile("open", [authorizeUrl.toString()], (error) => {
      if (error) console.error("Open the authorization URL from this terminal in a browser.");
    });
  }
});
