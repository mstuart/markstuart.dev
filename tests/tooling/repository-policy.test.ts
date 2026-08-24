import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const script = resolve("scripts/check-repository-policy.mjs");
const temporaryRepositories: string[] = [];

function repositoryWithTracked(path: string) {
  const directory = mkdtempSync(join(tmpdir(), "markstuart-policy-"));
  temporaryRepositories.push(directory);
  execFileSync("git", ["init", "--quiet"], { cwd: directory });
  mkdirSync(join(directory, path, ".."), { recursive: true });
  writeFileSync(join(directory, path), "artifact\n");
  execFileSync("git", ["add", path], { cwd: directory });
  return directory;
}

afterEach(() => {
  for (const directory of temporaryRepositories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("repository policy", () => {
  it("accepts an ordinary tracked document", () => {
    const directory = repositoryWithTracked("docs/architecture.md");
    const result = spawnSync(process.execPath, [script], { cwd: directory, encoding: "utf8" });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it.each([
    "docs/superpowers/plans/change.md",
    ".superpowers/sdd/change.md",
    "docs/implementation-plan.superpowers.md",
  ])("rejects tracked Superpowers artifact %s", (path) => {
    const directory = repositoryWithTracked(path);
    const result = spawnSync(process.execPath, [script], { cwd: directory, encoding: "utf8" });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(path);
    expect(result.stderr).not.toContain("artifact\n");
  });
});
