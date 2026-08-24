import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("repository quality contract", () => {
  it("exposes the aggregate verification scripts", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));

    expect(pkg.scripts).toMatchObject({
      test: "vitest run",
      typecheck: "next typegen && tsc --noEmit",
      check: "npm run lint && npm run typecheck && npm test && npm run build",
    });
  });
});
