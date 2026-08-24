import { once } from "node:events";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { networkInterfaces } from "node:os";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { describe, expect, it } from "vitest";

const refreshToken = "test-refresh-token-sentinel";
const providerDetail = "sensitive-provider-detail-sentinel";
const genericError = "Authorization could not be completed.";
const listenerError =
  "Could not start the local callback server. Close any process using the callback port, then try again.";

interface RunningHelper {
  child: ChildProcessWithoutNullStreams;
  authorizeUrl: URL;
  callbackUrl: URL;
  output: () => string;
  stop: () => Promise<void>;
}

interface SpawnedHelper {
  child: ChildProcessWithoutNullStreams;
  output: () => string;
}

function waitForAuthorizeUrl(child: ChildProcessWithoutNullStreams, output: () => string) {
  return new Promise<URL>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`OAuth helper did not start:\n${output()}`)), 5000);

    const inspect = () => {
      const match = output().match(/https:\/\/accounts\.spotify\.com\/authorize\?[^\s]+/);
      if (match) {
        clearTimeout(timeout);
        resolve(new URL(match[0]));
      }
    };

    child.stdout.on("data", inspect);
    child.stderr.on("data", inspect);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`OAuth helper exited with ${code}:\n${output()}`));
    });
  });
}

function spawnHelper(args: string[] = []): SpawnedHelper {
  const child = spawn(
    process.execPath,
    ["--import", "./tests/scripts/stub-spotify-fetch.mjs", "./scripts/spotify-setup.mjs", ...args],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SPOTIFY_CLIENT_ID: "test-client-id",
        SPOTIFY_CLIENT_SECRET: "test-client-secret",
        SPOTIFY_SETUP_NO_OPEN: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
    }
  );
  child.stdin.end();
  let combined = "";
  child.stdout.on("data", (chunk) => {
    combined += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    combined += chunk.toString();
  });

  return { child, output: () => combined };
}

async function waitForChildExit(
  child: ChildProcessWithoutNullStreams,
  output: () => string,
  timeoutMs = 5000
): Promise<number | null> {
  if (child.exitCode !== null || child.signalCode !== null) return child.exitCode;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      once(child, "exit") as Promise<[number | null, NodeJS.Signals | null]>,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`OAuth helper did not exit:\n${output()}`)),
          timeoutMs
        );
      }),
    ]);
    return result[0];
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function stopChild(child: ChildProcessWithoutNullStreams, output: () => string) {
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  if (child.exitCode === null && child.signalCode === null) await waitForChildExit(child, output);
}

async function startHelper(...args: string[]): Promise<RunningHelper> {
  const spawned = spawnHelper(["--callback-port=0", ...args]);
  const { child, output } = spawned;
  const authorizeUrl = await waitForAuthorizeUrl(child, output);
  const redirectUri = authorizeUrl.searchParams.get("redirect_uri");
  if (!redirectUri) throw new Error(`OAuth helper omitted redirect_uri:\n${output()}`);

  return {
    child,
    authorizeUrl,
    callbackUrl: new URL(redirectUri),
    output,
    stop: () => stopChild(child, output),
  };
}

async function waitForHelperExit(helper: RunningHelper) {
  return waitForChildExit(helper.child, helper.output);
}

async function listen(server: Server, port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
}

async function close(server: Server): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function occupyDefaultPortIfAvailable(): Promise<Server | null> {
  const server = createServer();
  try {
    await listen(server, 8888);
    return server;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") return null;
    throw error;
  }
}

async function reserveLoopbackPort(): Promise<{ port: number; server: Server }> {
  const server = createServer();
  await listen(server, 0);
  return { port: (server.address() as AddressInfo).port, server };
}

async function expectLoopbackPortReusable(port: number): Promise<void> {
  const server = createServer();
  try {
    await listen(server, port);
  } finally {
    await close(server);
  }
}

async function canBindLoopback(): Promise<boolean> {
  const server = createServer();
  try {
    await listen(server, 0);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EACCES" || code === "EPERM") return false;
    throw error;
  } finally {
    await close(server);
  }
}

const loopbackAvailable = await canBindLoopback();
const loopbackIt = loopbackAvailable ? it : it.skip;

describe("Spotify OAuth setup helper", () => {
  loopbackIt("uses a high-entropy state and accepts connections only on IPv4 loopback", async () => {
    const defaultPortBlocker = await occupyDefaultPortIfAvailable();
    let helper: RunningHelper | undefined;

    try {
      helper = await startHelper();
      expect(helper.authorizeUrl.searchParams.get("state") ?? "").toMatch(/^[a-f0-9]{64}$/);
      expect(helper.callbackUrl.hostname).toBe("127.0.0.1");
      await expect(
        fetch(new URL("/not-a-callback", helper.callbackUrl))
      ).resolves.toMatchObject({ status: 404 });

      const externalAddress = Object.values(networkInterfaces())
        .flat()
        .find((address) => address?.family === "IPv4" && !address.internal)?.address;
      if (externalAddress) {
        await expect(
          fetch(`http://${externalAddress}:${helper.callbackUrl.port}/not-a-callback`, {
            signal: AbortSignal.timeout(1000),
          })
        ).rejects.toThrow();
      }
    } finally {
      if (helper) await helper.stop();
      if (defaultPortBlocker) await close(defaultPortBlocker);
    }
  });

  loopbackIt("rejects a callback whose state does not match", async () => {
    const helper = await startHelper();

    try {
      const response = await fetch(
        new URL("/callback?code=valid-code&state=wrong-state", helper.callbackUrl)
      );
      expect(response.status).toBe(400);
      expect(await response.text()).toBe(genericError);
    } finally {
      await helper.stop();
    }
  });

  loopbackIt("rejects a same-character-length state with a different byte length", async () => {
    const helper = await startHelper();

    try {
      const malformedState = encodeURIComponent("é".repeat(64));
      const response = await fetch(
        new URL(`/callback?code=valid-code&state=${malformedState}`, helper.callbackUrl)
      );
      expect(response.status).toBe(400);
      expect(await response.text()).toBe(genericError);
    } finally {
      await helper.stop();
    }
  });

  loopbackIt("confirms receipt without printing the refresh token by default", async () => {
    const helper = await startHelper();

    try {
      const state = helper.authorizeUrl.searchParams.get("state");
      const response = await fetch(
        new URL(`/callback?code=valid-code&state=${state}`, helper.callbackUrl)
      );
      expect(response.status).toBe(200);
      await waitForHelperExit(helper);
      expect(helper.output()).toContain("Refresh token received.");
      expect(helper.output()).not.toContain(refreshToken);
    } finally {
      await helper.stop();
    }
  });

  loopbackIt("prints the refresh token only with the explicit flag", async () => {
    const helper = await startHelper("--print-token");

    try {
      const state = helper.authorizeUrl.searchParams.get("state");
      await fetch(new URL(`/callback?code=valid-code&state=${state}`, helper.callbackUrl));
      await waitForHelperExit(helper);
      expect(helper.output()).toContain(`SPOTIFY_REFRESH_TOKEN=${refreshToken}`);
    } finally {
      await helper.stop();
    }
  });

  loopbackIt("keeps provider failure details out of browser and terminal output", async () => {
    const helper = await startHelper();

    try {
      const state = helper.authorizeUrl.searchParams.get("state");
      const response = await fetch(
        new URL(`/callback?code=provider-error&state=${state}`, helper.callbackUrl)
      );
      expect(response.status).toBe(502);
      expect(await response.text()).toBe(genericError);
      await waitForHelperExit(helper);
      expect(helper.output()).not.toContain(providerDetail);
      expect(helper.output()).toContain("Authorization could not be completed.");
    } finally {
      await helper.stop();
    }
  });

  loopbackIt("closes the loopback listener when authorization is abandoned", async () => {
    const helper = await startHelper("--authorization-timeout-ms=50");
    const port = Number(helper.callbackUrl.port);

    try {
      await expect(waitForHelperExit(helper)).resolves.toBe(1);
      expect(helper.output()).toContain("Authorization timed out. Run the setup again.");
      await expectLoopbackPortReusable(port);
    } finally {
      await helper.stop();
    }
  });

  loopbackIt("aborts a stalled token exchange and closes the listener", async () => {
    const helper = await startHelper("--token-timeout-ms=50");

    try {
      const state = helper.authorizeUrl.searchParams.get("state");
      const response = await fetch(
        new URL(`/callback?code=stall&state=${state}`, helper.callbackUrl),
        { signal: AbortSignal.timeout(2000) }
      );

      expect(response.status).toBe(502);
      expect(await response.text()).toBe(genericError);
      await expect(waitForHelperExit(helper)).resolves.toBe(1);
      expect(helper.output()).toContain(genericError);
    } finally {
      await helper.stop();
    }
  });

  it("handles an occupied callback port without leaking the listener error", async () => {
    const reservation = loopbackAvailable ? await reserveLoopbackPort() : null;
    const helper = spawnHelper([
      `--callback-port=${reservation?.port ?? 0}`,
    ]);

    try {
      await expect(waitForChildExit(helper.child, helper.output, 2000)).resolves.toBe(1);
      expect(helper.output()).toContain(listenerError);
      expect(helper.output()).not.toContain("EADDRINUSE");
      expect(helper.output()).not.toContain("test-client-secret");
    } finally {
      await stopChild(helper.child, helper.output);
      if (reservation) await close(reservation.server);
    }
  });
});
