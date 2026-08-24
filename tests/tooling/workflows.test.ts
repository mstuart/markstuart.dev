import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

const CHECKOUT_SHA = "3d3c42e5aac5ba805825da76410c181273ba90b1";
const SETUP_NODE_SHA = "820762786026740c76f36085b0efc47a31fe5020";

type Step = {
  run?: string;
  uses?: string;
  with?: Record<string, unknown>;
};

type Workflow = {
  concurrency?: Record<string, unknown>;
  jobs: Record<string, { steps: Step[] }>;
  on: Record<string, unknown>;
  permissions: Record<string, string>;
};

function workflow(path: string) {
  return parse(readFileSync(path, "utf8")) as Workflow;
}

function uses(document: Workflow) {
  return Object.values(document.jobs).flatMap((job) =>
    job.steps.flatMap((step) => (step.uses ? [step.uses] : []))
  );
}

describe("GitHub workflows", () => {
  it.each([".github/workflows/ci.yml", ".github/workflows/security-audit.yml"])(
    "%s uses least privilege and immutable official actions",
    (path) => {
      const document = workflow(path);
      expect(document.permissions).toEqual({ contents: "read" });
      expect(document.on).not.toHaveProperty("pull_request_target");
      expect(uses(document)).toEqual(
        expect.arrayContaining([
          `actions/checkout@${CHECKOUT_SHA}`,
          `actions/setup-node@${SETUP_NODE_SHA}`,
        ])
      );
      expect(uses(document).every((action) => /@[0-9a-f]{40}$/.test(action))).toBe(true);
    }
  );

  it("runs the complete CI gates against the pinned runtime", () => {
    const document = workflow(".github/workflows/ci.yml");
    const steps = document.jobs.check.steps;
    const commands = steps.flatMap((step) => (step.run ? [step.run] : []));
    const setup = steps.find((step) => step.uses?.startsWith("actions/setup-node@"));

    expect(setup?.with).toMatchObject({ "node-version-file": ".node-version", cache: "npm" });
    expect(commands).toEqual(expect.arrayContaining(["npm ci", "npm run check"]));
    expect(document.concurrency).toMatchObject({ "cancel-in-progress": true });
  });
});
