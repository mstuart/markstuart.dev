import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function run(path: string, ...args: string[]) {
  return execFileSync(process.execPath, [path, ...args], { encoding: "utf8" });
}

describe("repository scripts", () => {
  it("documents the production smoke without starting a server", () => {
    expect(run("scripts/smoke-start.mjs", "--help")).toMatch(/build[\s\S]*next start[\s\S]*200[\s\S]*404/i);
  });

  it("documents and verifies repository runtime metadata", () => {
    expect(run("scripts/verify-runtime.mjs", "--help")).toMatch(/Node 24\.19\.0[\s\S]*npm 11\.19\.0/i);
    expect(run("scripts/verify-runtime.mjs", "--metadata-only")).toMatch(/runtime metadata is consistent/i);
  });

  it("lists contributor-facing commands", () => {
    const output = run("scripts/help.mjs");
    expect(output).toContain("npm run check");
    expect(output).toContain("npm run coverage");
    expect(output).toContain("npm run smoke");
  });
});
