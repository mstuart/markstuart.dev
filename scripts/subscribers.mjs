#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { createJiti } from "jiti";

async function listConfirmedSubscribers() {
  const jiti = createJiti(import.meta.url, { alias: { "@": process.cwd() } });
  const store = await jiti.import("../lib/subscribers-store.ts");
  return store.listConfirmedSubscribers();
}

function showEmailsFrom(args) {
  if (args.length === 0) return false;
  if (args.length === 1 && args[0] === "--show-emails") return true;
  throw new Error("Invalid subscriber report arguments");
}

function formatReport(subscribers, showEmails) {
  const sorted = [...subscribers].sort();
  const count = `Active subscribers: ${sorted.length}`;
  return showEmails && sorted.length > 0 ? `${count}\n\n${sorted.join("\n")}` : count;
}

export async function runSubscriberCommand({
  args = process.argv.slice(2),
  listSubscribers = listConfirmedSubscribers,
  write = console.log,
  writeError = console.error,
} = {}) {
  try {
    const showEmails = showEmailsFrom(args);
    const subscribers = await listSubscribers();
    write(formatReport(subscribers, showEmails));
    return 0;
  } catch {
    writeError("Unable to load subscribers. Check Redis configuration.");
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await runSubscriberCommand();
}
