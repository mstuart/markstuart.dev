import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PostsPage from "@/app/(site)/posts/page";
import { writing } from "@/lib/data/writing";
import { getAllPosts } from "@/lib/posts";

const temporaryRoots: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

async function readPostsFrom(frontmatter: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "writing-themes-"));
  temporaryRoots.push(root);
  const postsDirectory = path.join(root, "content", "posts");
  fs.mkdirSync(postsDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(postsDirectory, "example.mdx"),
    `---\n${frontmatter}\n---\n\nA short post.\n`
  );
  vi.spyOn(process, "cwd").mockReturnValue(root);
  vi.resetModules();

  const { getAllPosts } = await import("@/lib/posts");
  return getAllPosts();
}

describe("local writing metadata", () => {
  it("preserves a declared note format and primary theme", async () => {
    const posts = await readPostsFrom(
      `title: Example\ndate: "2026-08-24"\ndescription: Example description\nformat: note\ntheme: APIs & GraphQL`
    );

    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({
      format: "note",
      theme: "APIs & GraphQL",
    });
  });

  it("uses stable defaults when format and theme are absent", async () => {
    const posts = await readPostsFrom(
      `title: Existing post\ndate: "2026-08-23"\ndescription: Existing description`
    );

    expect(posts[0]).toMatchObject({
      format: "article",
      theme: "Developer platforms & SDKs",
    });
  });
});

describe("external writing metadata", () => {
  it("assigns each external article to its accurate primary theme", async () => {
    const { writing } = await import("@/lib/data/writing");

    expect(writing).toHaveLength(6);
    expect(
      writing.map(({ title, theme }) => ({ title, theme }))
    ).toEqual([
      {
        title: "The new era of static analysis: AI-authored, deterministically enforced",
        theme: "AI-enabled engineering",
      },
      {
        title: "Scaling GraphQL at PayPal",
        theme: "APIs & GraphQL",
      },
      {
        title: "GraphQL: Instrumenting your API and unlocking superpowers",
        theme: "APIs & GraphQL",
      },
      {
        title: "GraphQL Resolvers: Best Practices",
        theme: "APIs & GraphQL",
      },
      {
        title: "GraphQL: A Success Story for PayPal Checkout",
        theme: "APIs & GraphQL",
      },
      {
        title: "Securing your JS apps w/ Stateless CSRF",
        theme: "APIs & GraphQL",
      },
    ]);
  });
});

describe("Writing page themes", () => {
  it("shows one unified, non-duplicated list organized under exactly three themes", () => {
    render(<PostsPage />);

    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "Developer platforms & SDKs",
      "APIs & GraphQL",
      "AI-enabled engineering",
    ]);

    const developerSection = screen.getByRole("region", {
      name: "Developer platforms & SDKs",
    });
    const apiSection = screen.getByRole("region", { name: "APIs & GraphQL" });
    const aiSection = screen.getByRole("region", { name: "AI-enabled engineering" });

    expect(within(developerSection).getByText("Hello, world")).toBeInTheDocument();
    expect(
      within(developerSection).getByText(
        "Building federated API platforms for large organizations"
      )
    ).toBeInTheDocument();
    expect(within(apiSection).getByText("Scaling GraphQL at PayPal")).toBeInTheDocument();
    expect(
      within(apiSection).getByText("What I learned scaling GraphQL and Checkout at PayPal")
    ).toBeInTheDocument();
    expect(
      within(apiSection).getByText("Securing your JS apps w/ Stateless CSRF")
    ).toBeInTheDocument();
    expect(
      within(aiSection).getByText(
        "The new era of static analysis: AI-authored, deterministically enforced"
      )
    ).toBeInTheDocument();
    expect(
      within(aiSection).getByText("What coding-agent infrastructure is still missing")
    ).toBeInTheDocument();

    for (const title of [...getAllPosts(), ...writing].map((entry) => entry.title)) {
      expect(screen.getAllByText(title)).toHaveLength(1);
    }

    expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
    expect(screen.getAllByText("Article")).toHaveLength(getAllPosts().length);
    expect(screen.getAllByText(/^PayPal Technology Blog/)).toHaveLength(5);
    expect(screen.getByText(/34K views/)).toBeInTheDocument();
    expect(screen.getByText("Aug 19, 2026")).toBeInTheDocument();
  });
});
