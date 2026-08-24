import { existsSync, readFileSync, readdirSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PressPage from "@/app/(site)/press/page";
import StackPage from "@/app/(site)/stack/page";
import TalksPage from "@/app/(site)/talks/page";
import PostsPage from "@/app/(site)/posts/page";
import { HomePage } from "@/components/home-page";

vi.mock("@/components/px/avatar", () => ({ PixelAvatar: () => null }));
vi.mock("@/components/px/scene5", () => ({ PixelScene5: () => null }));

const removedAssetDirectories = [
  "public/press",
  "public/talks",
  "public/stack",
  "public/work",
  "public/writing",
];

describe("public-release asset policy", () => {
  it("keeps third-party artwork out of the repository", () => {
    for (const directory of removedAssetDirectories) {
      expect(existsSync(directory), `${directory} should not exist`).toBe(false);
    }

    const retainedPublicVisuals = readdirSync("public", { recursive: true })
      .map(String)
      .filter((path) => /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(path))
      .sort();
    expect(retainedPublicVisuals).toEqual(["avatar.png", "poster-cat-8bit.png"]);
  });

  it("keeps employer names and links after removing employer logos", () => {
    render(<HomePage />);

    const employerLinks = [
      ["Rocket", "https://www.rocketcompanies.com/"],
      ["eBay", "https://www.ebay.com/"],
      ["PayPal", "https://www.paypal.com/"],
      ["State Farm", "https://www.statefarm.com/"],
    ] as const;

    for (const [name, href] of employerLinks) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
      expect(link.querySelector("img")).toBeNull();
    }
  });

  it("keeps press, talk, writing, and Stack evidence links without stored brand images", () => {
    const { unmount: unmountPress } = render(<PressPage />);
    expect(
      screen.getByRole("link", { name: /PayPal \+ Apollo GraphQL customer case study/i }),
    ).toHaveAttribute("href", "https://www.apollographql.com/customers/paypal");
    expect(document.querySelector("img")).toBeNull();
    unmountPress();

    const { unmount: unmountTalks } = render(<TalksPage />);
    expect(
      screen.getByRole("link", { name: /Does your API spark joy/i }),
    ).toHaveAttribute("href", "https://www.youtube.com/watch?v=tgdTC-EZKMg");
    expect(document.querySelector("img")).toBeNull();
    unmountTalks();

    const { unmount: unmountPosts } = render(<PostsPage />);
    const writingLink = screen.getByRole("link", { name: /Scaling GraphQL at PayPal/i });
    expect(writingLink).toHaveAttribute(
      "href",
      "https://medium.com/paypal-tech/scaling-graphql-at-paypal-b5b5ac098810",
    );
    expect(writingLink.querySelector("img")).toBeNull();
    unmountPosts();

    render(<StackPage />);
    const stackLink = screen.getByRole("link", { name: /MacBook Pro 14/i });
    expect(stackLink).toHaveAttribute(
      "href",
      "https://www.amazon.com/dp/B0DMKZSTQH?tag=mstuartsite-20",
    );
    expect(stackLink.querySelector("img")).toBeNull();
  });

  it("documents every retained visual asset and the Phosphor icon basis", () => {
    const ledger = readFileSync("docs/asset-rights.md", "utf8");

    for (const path of [
      "public/avatar.png",
      "public/poster-cat-8bit.png",
      "app/icon.svg",
      "app/apple-icon.tsx",
      "app/opengraph-image.tsx",
    ]) {
      expect(ledger, `${path} should appear in the retained-assets ledger`).toContain(path);
    }
    expect(ledger).toContain("@phosphor-icons/react@2.1.10");
    expect(ledger).toContain("https://github.com/phosphor-icons/react");
    expect(ledger).toContain("https://openai.com/policies/terms-of-use/");
    expect(ledger).toMatch(
      /no stored third-party employer, publication, conference, product, or tool\s+artwork remains/i,
    );
  });
});
