#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const EXPECTED_NODE = "24.19.0";
const EXPECTED_NPM = "11.19.0";
const help = process.argv.includes("--help");
const metadataOnly = process.argv.includes("--metadata-only");

if (help) {
  console.log(`Verify repository metadata and the active Node ${EXPECTED_NODE} / npm ${EXPECTED_NPM} toolchain.

Usage:
  node scripts/verify-runtime.mjs
  node scripts/verify-runtime.mjs --metadata-only
`);
  process.exit(0);
}

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const nodeVersion = readFileSync(new URL("../.node-version", import.meta.url), "utf8").trim();
const metadataFailures = [
  nodeVersion === EXPECTED_NODE || `.node-version must be ${EXPECTED_NODE}`,
  pkg.engines?.node === EXPECTED_NODE || `package.json engines.node must be ${EXPECTED_NODE}`,
  pkg.engines?.npm === EXPECTED_NPM || `package.json engines.npm must be ${EXPECTED_NPM}`,
  pkg.packageManager === `npm@${EXPECTED_NPM}` || `packageManager must be npm@${EXPECTED_NPM}`,
].filter((result) => result !== true);

if (metadataFailures.length > 0) {
  for (const failure of metadataFailures) process.stderr.write(`${failure}\n`);
  process.exit(1);
}

if (metadataOnly) {
  console.log("Repository runtime metadata is consistent.");
  process.exit(0);
}

const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
const npmVersion =
  process.env.npm_config_user_agent?.match(/^npm\/([^\s]+)/)?.[1] ??
  execFileSync(npmExecutable, ["--version"], { encoding: "utf8" }).trim();
const runtimeFailures = [
  process.versions.node === EXPECTED_NODE ||
    `Expected Node ${EXPECTED_NODE}, received ${process.versions.node}`,
  npmVersion === EXPECTED_NPM || `Expected npm ${EXPECTED_NPM}, received ${npmVersion}`,
].filter((result) => result !== true);

if (runtimeFailures.length > 0) {
  for (const failure of runtimeFailures) process.stderr.write(`${failure}\n`);
  process.exit(1);
}

console.log(`Runtime verified: Node ${EXPECTED_NODE}, npm ${EXPECTED_NPM}.`);
