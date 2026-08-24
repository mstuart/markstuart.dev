#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";

const HELP = `Start the existing production build with next start and verify:
  GET / returns HTTP 200
  GET /__production_smoke_missing__ returns HTTP 404

Run npm run build first, then npm run smoke.`;

if (process.argv.includes("--help")) {
  console.log(HELP);
  process.exit(0);
}

if (!existsSync(".next/BUILD_ID")) {
  console.error("No production build found. Run npm run build first.");
  process.exit(1);
}

const host = "127.0.0.1";
const port = await availablePort(host);
const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(
  npmExecutable,
  ["start", "--", "--hostname", host, "--port", String(port)],
  {
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  }
);

let output = "";
for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    output = `${output}${chunk}`.slice(-20_000);
  });
}

try {
  const root = await waitForResponse(`http://${host}:${port}/`, child, 45_000);
  if (root.status !== 200) throw new Error(`Expected / to return 200, received ${root.status}.`);
  const missing = await fetch(`http://${host}:${port}/__production_smoke_missing__`);
  if (missing.status !== 404) {
    throw new Error(`Expected missing route to return 404, received ${missing.status}.`);
  }
  console.log(`Production smoke passed on ${host}:${port} (200 and 404).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Production smoke failed.");
  if (output.trim()) console.error(output.trim());
  process.exitCode = 1;
} finally {
  await terminate(child);
}

function availablePort(hostname) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, hostname, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not allocate a smoke-test port."));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function waitForResponse(url, processHandle, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`next start exited before readiness with code ${processHandle.exitCode}.`);
    }
    try {
      return await fetch(url, { signal: AbortSignal.timeout(2_000) });
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error("Timed out waiting for next start.");
}

async function terminate(processHandle) {
  if (processHandle.exitCode !== null) return;
  processHandle.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => processHandle.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (processHandle.exitCode === null) processHandle.kill("SIGKILL");
}
