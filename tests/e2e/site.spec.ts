import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const coreRoutes = [
  ["/", "Mark Stuart"],
  ["/work", "Work"],
  ["/posts", "Writing"],
  ["/projects", "Projects"],
  ["/press", "Press"],
  ["/talks", "Talks"],
  ["/listening", "Listening"],
  ["/stack", "Stack"],
] as const;

for (const [path, heading] of coreRoutes) {
  test(`renders the ${heading} heading at ${path}`, async ({ page }) => {
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  });
}

test("desktop primary navigation reaches Work", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "desktop-only navigation");
  await page.goto("/");

  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Work" }).click();

  await expect(page).toHaveURL("/work");
  await expect(page.getByRole("heading", { level: 1, name: "Work" })).toBeVisible();
});

test("mobile menu reaches Projects", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-mobile", "mobile-only navigation");
  await page.goto("/");

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog", { name: "Site navigation" }).getByRole("link", { name: "Projects" }).click();

  await expect(page).toHaveURL("/projects");
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
});

test("theme control updates the document theme", async ({ page }) => {
  await page.goto("/");
  const themeControl = page.getByRole("button", { name: /Switch to (light|dark) theme/ });
  const label = await themeControl.getAttribute("aria-label");

  await themeControl.click();

  if (label === "Switch to dark theme") {
    await expect(page.locator("html")).toHaveClass(/dark/);
  } else {
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  }
});

test("footer source link points to this site's repository", async ({ page }) => {
  await page.goto("/");
  const sourceLink = page.getByRole("contentinfo").getByRole("link", { name: "Source" });

  await expect(sourceLink).toBeVisible();
  await expect(sourceLink).toHaveAttribute("href", "https://github.com/mstuart/markstuart.dev");
  await expect(sourceLink).toHaveAttribute("target", "_blank");
});

for (const [path, heading] of [
  ["/projects/peek", "peek"],
  ["/projects/tare", "tare"],
  ["/projects/graphql-agent-toolkit", "graphql-agent-toolkit"],
] as const) {
  test(`renders the ${heading} case study`, async ({ page }) => {
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  });
}

test("subscribe form is accessible without submitting", async ({ page }) => {
  await page.goto("/posts");
  const email = page.getByRole("textbox", { name: "Email address" });

  await expect(email).toHaveAttribute("type", "email");
  await expect(email).toHaveAttribute("required", "");
  await expect(email).toHaveAttribute("aria-describedby", "subscription-email-help");
  await expect(page.getByRole("button", { name: "Subscribe" })).toBeEnabled();
});

test("homepage does not overflow horizontally", async ({ page }) => {
  await page.goto("/");
  const viewport = page.viewportSize();
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

  expect(scrollWidth).toBeLessThanOrEqual(viewport?.width ?? 0);
});

test("homepage has no serious or critical accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const seriousOrCritical = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );

  expect(seriousOrCritical).toEqual([]);
});
