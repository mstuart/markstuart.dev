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

const removedAssetDirectories = ["public/writing"];

const restoredLogoPaths = [
  "press/apollo.png",
  "press/graphql.png",
  "press/graphqlweekly.png",
  "press/hn.svg",
  "press/novvum.png",
  "press/thinkb4.png",
  "press/ull.png",
  "stack/agentbrowser.png",
  "stack/airpods.png",
  "stack/anker.png",
  "stack/apple.png",
  "stack/chrome.png",
  "stack/claude.png",
  "stack/divvy.png",
  "stack/docker.png",
  "stack/ghostty.png",
  "stack/hiddenbar.png",
  "stack/keychron.png",
  "stack/lg.png",
  "stack/lmstudio.png",
  "stack/logitech.png",
  "stack/ohmyzsh.png",
  "stack/ollama.png",
  "stack/pearcleaner.png",
  "stack/sennheiser.png",
  "stack/slack.png",
  "stack/tmux.png",
  "stack/vscode.png",
  "stack/wisprflow.png",
  "stack/zoom.png",
  "talks/codetv.png",
  "talks/dotw.png",
  "talks/enterjs.png",
  "talks/github.png",
  "talks/graphql.png",
  "talks/hasura.png",
  "talks/html5devconf.png",
  "talks/midwestjs.png",
  "talks/platformsh.png",
  "talks/thisdot.png",
  "work/ebay.png",
  "work/paypal.png",
  "work/qplay.png",
  "work/rocket.png",
  "work/statefarm.png",
].sort();

const articleAssetPaths = [
  "posts/jquery-universal-browser-api/john-resig-jsconf-us-2010.jpg",
  "posts/jquery-universal-browser-api/jquery-chain-carbon-mobile.png",
  "posts/jquery-universal-browser-api/jquery-chain-carbon.png",
  "posts/jquery-universal-browser-api/paul-irish-jquery-source-youtube.jpg",
].sort();

function expectImagePath(container: Element, path: string) {
  const image = container.querySelector("img");
  expect(image).not.toBeNull();
  expect(decodeURIComponent(image?.getAttribute("src") ?? "")).toContain(path);
}

describe("public-release asset policy", () => {
  it("keeps only the explicitly approved visual assets", () => {
    for (const directory of removedAssetDirectories) {
      expect(existsSync(directory), `${directory} should not exist`).toBe(false);
    }

    const retainedPublicVisuals = readdirSync("public", { recursive: true })
      .map(String)
      .filter((path) => /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(path))
      .sort();
    expect(retainedPublicVisuals).toEqual(
      ["avatar.png", "poster-cat-8bit.png", ...articleAssetPaths, ...restoredLogoPaths].sort(),
    );
  });

  it("keeps employer names, links, and restored logos together", () => {
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
      expect(link.querySelector("img")).not.toBeNull();
    }
  });

  it("restores logos to press, talks, writing, and Stack", () => {
    const { unmount: unmountPress } = render(<PressPage />);
    for (const [name, path] of [
      [/PayPal \+ Apollo GraphQL customer case study/i, "/press/apollo.png"],
      [/GraphQL Weekly, Issue 116/i, "/press/graphqlweekly.png"],
      [/Universidad de La Laguna/i, "/press/ull.png"],
      [/36 GraphQL Concepts Every Developer Should Know/i, "/press/novvum.png"],
      [/A Walk in GraphQL, Day 2 lesson/i, "/press/thinkb4.png"],
      [/GraphQL at PayPal: An Adoption Story/i, "/work/paypal.png"],
      [/graphql\.org, "Who's Using GraphQL" page/i, "/press/graphql.png"],
      [/Discussed on Hacker News/i, "/press/hn.svg"],
    ] as const) {
      const pressLink = screen.getByRole("link", { name });
      expectImagePath(pressLink.closest("li")!, path);
    }
    unmountPress();

    const { unmount: unmountTalks } = render(<TalksPage />);
    const talkLogoPaths = screen.getAllByRole("listitem").map((row) => {
      const source = row.querySelector("img")?.getAttribute("src") ?? "";
      return new URL(source, "https://markstuart.dev").searchParams.get("url");
    });
    expect(talkLogoPaths.sort()).toEqual([
      "/talks/codetv.png",
      "/talks/dotw.png",
      "/talks/enterjs.png",
      "/talks/github.png",
      "/talks/graphql.png",
      "/talks/hasura.png",
      "/talks/html5devconf.png",
      "/talks/midwestjs.png",
      "/talks/platformsh.png",
      "/talks/thisdot.png",
      "/talks/thisdot.png",
      "/talks/thisdot.png",
      "/work/paypal.png",
      "/work/paypal.png",
    ].sort());
    unmountTalks();

    const { unmount: unmountPosts } = render(<PostsPage />);
    const rocketLink = screen.getByRole("link", {
      name: /The new era of static analysis: AI-authored, deterministically enforced/i,
    });
    expectImagePath(rocketLink, "/work/rocket.png");
    for (const name of [
      /Scaling GraphQL at PayPal/i,
      /GraphQL: Instrumenting your API and unlocking superpowers/i,
      /GraphQL Resolvers: Best Practices/i,
      /GraphQL: A Success Story for PayPal Checkout/i,
      /Securing your JS apps w\/ Stateless CSRF/i,
    ]) {
      expectImagePath(screen.getByRole("link", { name }), "/work/paypal.png");
    }
    unmountPosts();

    render(<StackPage />);
    const stackLogoPaths = Array.from(document.querySelectorAll("img")).map((image) => {
      const source = image.getAttribute("src") ?? "";
      return new URL(source, "https://markstuart.dev").searchParams.get("url");
    });
    expect(stackLogoPaths.sort()).toEqual(
      restoredLogoPaths
        .filter((path) => path.startsWith("stack/"))
        .map((path) => `/${path}`)
        .sort(),
    );
  });

  it("documents every retained visual asset and the Phosphor icon basis", () => {
    const ledger = readFileSync("docs/asset-rights.md", "utf8");

    for (const path of [
      "public/avatar.png",
      "public/poster-cat-8bit.png",
      "public/work/ebay.png",
      "public/work/paypal.png",
      "public/work/qplay.png",
      "public/work/rocket.png",
      "public/work/statefarm.png",
      "app/icon.svg",
      "app/apple-icon.tsx",
      "app/opengraph-image.tsx",
    ]) {
      expect(ledger, `${path} should appear in the retained-assets ledger`).toContain(path);
    }
    for (const pattern of ["public/press/*", "public/stack/*.png", "public/talks/*.png"]) {
      expect(ledger).toContain(pattern);
    }
    expect(ledger).toContain("@phosphor-icons/react@2.1.10");
    expect(ledger).toContain("https://github.com/phosphor-icons/react");
    expect(ledger).toContain("https://openai.com/policies/terms-of-use/");
    expect(ledger).toMatch(/employer marks[\s\S]*nominative/i);
  });
});
