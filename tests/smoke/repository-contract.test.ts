import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

describe("repository quality contract", () => {
  it("pins the supported runtime and exposes every verification script", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const nodeVersion = readFileSync(".node-version", "utf8").trim();

    expect(nodeVersion).toBe("24.19.0");
    expect(pkg.engines).toEqual({ node: "24.19.0", npm: "11.19.0" });
    expect(pkg.packageManager).toBe("npm@11.19.0");
    expect(pkg.license).toBe("MIT");
    expect(pkg.scripts).toMatchObject({
      help: "node scripts/help.mjs",
      lint: "eslint --max-warnings=0",
      test: "vitest run",
      coverage: "vitest run --coverage",
      e2e: "playwright test",
      typecheck: "next typegen && tsc --noEmit",
      policy: "node scripts/check-repository-policy.mjs",
      runtime: "node scripts/verify-runtime.mjs",
      smoke: "node scripts/smoke-start.mjs",
      "smoke:providers": "node scripts/provider-smoke.mjs",
      check:
        "npm run policy && npm run runtime && npm run lint && npm run typecheck && npm test && npm run coverage && npm run build && npm run e2e && npm run smoke",
    });
    expect(pkg.dependencies).not.toHaveProperty("resend");
    expect(pkg.devDependencies).toHaveProperty("@axe-core/playwright");
    expect(pkg.devDependencies).toHaveProperty("@playwright/test");
    expect(pkg.devDependencies).not.toHaveProperty("axe-core");
    expect(pkg.devDependencies).toHaveProperty("@types/node");
    expect(pkg.devDependencies).toHaveProperty("@vitest/coverage-v8");
    expect(pkg.devDependencies).toHaveProperty("yaml");

    const vitestConfig = readFileSync("vitest.config.mts", "utf8");
    expect(vitestConfig).toContain("statements: 70");
    expect(vitestConfig).toContain("branches: 60");
    expect(vitestConfig).toContain("functions: 70");
    expect(vitestConfig).toContain("lines: 70");
  });

  it("runs a pinned, read-only external link check every week", () => {
    const workflow = parse(readFileSync(".github/workflows/link-check.yml", "utf8"));

    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(workflow.on.schedule).toEqual([{ cron: "30 9 * * 1" }]);
    expect(workflow.on).toHaveProperty("workflow_dispatch");

    const steps = workflow.jobs.links.steps as Array<Record<string, unknown>>;
    expect(steps[0]).toHaveProperty(
      "uses",
      "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
    );
    expect(steps[1]).toMatchObject({
      uses: "lycheeverse/lychee-action@e7477775783ea5526144ba13e8db5eec57747ce8",
      with: { lycheeVersion: "v0.24.2", fail: true },
    });
    const args = (steps[1].with as { args: string }).args;
    expect(args).toContain("--extensions md,mdx,ts,tsx");
    expect(args).toContain("medium\\.com|npmjs\\.com");
    expect(args).toContain("^file://.*/(posts|projects|talks)$");
  });
});
