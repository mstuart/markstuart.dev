import { describe, expect, it } from "vitest";
import {
  focusAreas,
  industryContributions,
  resumeRoles,
  resumeSummary,
} from "@/lib/data/resume";
import { cliTools, stackSections } from "@/lib/data/stack";
import { work } from "@/lib/data/work";

describe("public profile content safety", () => {
  it("publishes the exact hardware stack without health or purchase-history details", () => {
    const publicStack = JSON.stringify({ cliTools, stackSections });
    const hardware = stackSections.find((section) => section.heading === "Hardware")?.items ?? [];
    const codex = stackSections
      .find((section) => section.heading === "AI")
      ?.items.find((item) => item.name === "Codex");

    expect(stackSections.map((section) => section.heading)).toEqual([
      "Hardware",
      "AI",
      "Editor and terminal",
      "Apps",
    ]);
    expect(hardware.map((item) => item.name)).toEqual([
      'MacBook Pro 14"',
      "LG UltraGear 45GX950A",
      "SHW Electric Standing Desk",
      "Keychron K2",
      "Anker 7-in-2 USB-C Hub",
      "USB 3.0 KVM Switch",
      "Logitech Brio 4K",
      "AirPods Pro 3",
      "Sennheiser HD 6XX",
      "LUKETURE Under-Desk Organizer",
      "UREVO Walking Pad",
    ]);
    expect(hardware.find((item) => item.name === 'MacBook Pro 14"')).toMatchObject({
      description: expect.stringContaining("M4 Max, 36 GB RAM"),
      url: "https://www.amazon.com/dp/B0DMKZSTQH?tag=mstuartsite-20",
    });
    expect(hardware.find((item) => item.name === "LG UltraGear 45GX950A")).toMatchObject({
      description: expect.stringContaining('45" 5K2K OLED'),
      url: "https://www.amazon.com/dp/B0DYG9DKX8?tag=mstuartsite-20",
    });
    expect(
      hardware
        .filter((item) => item.url?.startsWith("https://www.amazon.com/"))
        .every((item) => item.url?.endsWith("?tag=mstuartsite-20")),
    ).toBe(true);
    expect(publicStack).not.toMatch(
      /bought|purchased|second set|Fitbit|Google Health|vitals project|1Password|Every secret|all installed via Homebrew/i,
    );
    expect(codex?.iconSrc).toBeUndefined();
    expect(codex?.icon).toBeUndefined();
  });

  it("keeps public career history while omitting employer-internal architecture, security workflows, and scale details", () => {
    const publicCareer = JSON.stringify({
      focusAreas,
      industryContributions,
      resumeRoles,
      resumeSummary,
      work,
    });

    expect(resumeRoles.map(({ company, title }) => ({ company, title }))).toContainEqual({
      company: "Rocket",
      title: "Distinguished Engineer",
    });
    expect(publicCareer).toMatch(/eBay Live/);
    expect(publicCareer).toMatch(/GraphQL Foundation/);
    expect(resumeSummary).toMatch(/nearly two decades in software engineering/i);
    expect(work.map(({ company, role, period }) => ({ company, role, period }))).toEqual([
      { company: "Rocket", role: "Distinguished Engineer", period: "May 2025 to now" },
      { company: "eBay", role: "Distinguished Engineer", period: "Oct 2022 to May 2025" },
      {
        company: "PayPal",
        role: "Sr. Principal Engineer",
        period: "Nov 2013 to Sep 2022",
      },
    ]);
    expect(work.at(-1)?.summary).toBe(
      "Led Checkout Web, PayPal SDKs, and Web Platform; drove GraphQL adoption company-wide and led a large engineering organization.",
    );
    expect(work.find(({ company }) => company === "eBay")?.summary).toBe(
      "Led technical strategy for eBay Live, a live auction video streaming platform, and scaled CI/CD across eBay’s applications and platforms.",
    );
    expect(work.find(({ company }) => company === "Rocket")?.summary).toBe(
      "Architected Rocket’s federated GraphQL platform, which powers every key Web, Mobile, and AI assistant experience, and enabled the integration of Mr. Cooper into Rocket.",
    );
    expect(
      resumeRoles.map(({ company, title, start, end }) => ({ company, title, start, end })),
    ).toEqual(
      expect.arrayContaining([
        {
          company: "State Farm Insurance",
          title: "Software Engineer",
          start: "2007-05",
          end: "2012-07",
        },
        {
          company: "PayPal",
          title: "Sr. Software Engineer",
          start: "2012-07",
          end: "2013-04",
        },
        {
          company: "Qplay, Inc.",
          title: "Sr. Software Engineer",
          start: "2013-04",
          end: "2013-11",
        },
        {
          company: "PayPal",
          title: "Staff Software Engineer",
          start: "2013-11",
          end: "2015-02",
        },
        {
          company: "PayPal",
          title: "Director of Engineering",
          start: "2021-02",
          end: "2021-12",
        },
        {
          company: "PayPal",
          title: "Sr. Principal Engineer",
          start: "2022-01",
          end: "2022-09",
        },
      ]),
    );
    expect(
      resumeRoles.find(({ title }) => title === "Sr. Principal Engineer")?.short,
    ).toBe("Led technical strategy for PayPal SDKs and Checkout Web.");
    expect(publicCareer).not.toMatch(
      /agent skills marketplace|autonomous development pipeline|open pull requests across the org|resolve CI failures|production errors|vulnerability remediation|error healing|IVR\/Phone|mortgage, payments, and identity|services can be swapped|hundreds of thousands|per-client data access controls|cache invalidation|security scanning enforcement|largest US mortgage servicer|800\+|tens of millions|50-60%|300\+ Node\.js|350\+ apps|800\+ developers|Checkout Lite|Batch REST|Active\/Active|single data center|100\+ engineer|5x faster|stealth startup/i,
    );
  });
});
