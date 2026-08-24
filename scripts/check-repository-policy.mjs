#!/usr/bin/env node

import { execFileSync } from "node:child_process";

if (process.argv.includes("--help")) {
  console.log("Check tracked paths and reject Superpowers planning or implementation artifacts.");
  process.exit(0);
}

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const forbidden = tracked.filter(
  (path) =>
    /(^|\/)\.?(?:superpowers)(?:\/|$)/i.test(path) ||
    /(^|\/)[^/]*superpowers[^/]*\.(?:md|mdx|txt)$/i.test(path)
);

if (forbidden.length > 0) {
  process.stderr.write(`Forbidden tracked Superpowers artifacts:\n${forbidden.join("\n")}\n`);
  process.exit(1);
}

console.log(`Repository policy passed for ${tracked.length} tracked paths.`);
