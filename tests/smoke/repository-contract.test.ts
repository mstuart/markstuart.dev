import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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
      typecheck: "next typegen && tsc --noEmit",
      policy: "node scripts/check-repository-policy.mjs",
      runtime: "node scripts/verify-runtime.mjs",
      smoke: "node scripts/smoke-start.mjs",
      check:
        "npm run policy && npm run runtime && npm run lint && npm run typecheck && npm test && npm run coverage && npm run build && npm run smoke",
    });
    expect(pkg.dependencies).not.toHaveProperty("resend");
    expect(pkg.devDependencies).not.toHaveProperty("@axe-core/playwright");
    expect(pkg.devDependencies).not.toHaveProperty("axe-core");
    expect(pkg.devDependencies).toHaveProperty("@types/node");
    expect(pkg.devDependencies).toHaveProperty("@vitest/coverage-v8");
    expect(pkg.devDependencies).toHaveProperty("yaml");
  });
});
