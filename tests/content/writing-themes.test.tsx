import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
        theme: "Web application security",
      },
    ]);
  });
});

describe("Writing page themes", () => {
  it("shows one non-duplicated list ordered newest first", () => {
    render(<PostsPage />);

    const list = screen.getByRole("list", { name: "Writing" });
    const links = within(list).getAllByRole("link");

    expect(links).toHaveLength(getAllPosts().length + writing.length);
    expect(links[0]).toHaveAccessibleName(/Stripe: the developer experience that reset the standard/i);

    for (const title of [...getAllPosts(), ...writing].map((entry) => entry.title)) {
      expect(screen.getAllByText(title)).toHaveLength(1);
    }

    expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
    expect(screen.queryAllByText("Article")).toHaveLength(getAllPosts().length);
    expect(screen.getAllByText(/^PayPal Technology Blog/)).toHaveLength(5);
    expect(screen.getByText(/34K views/)).toBeInTheDocument();
    expect(screen.queryByText("Hello, world")).not.toBeInTheDocument();
  });

  it("filters the list by theme with a visible selected state and result announcement", async () => {
    const user = userEvent.setup();
    render(<PostsPage />);
    const localPosts = getAllPosts();
    const totalCount = localPosts.length + writing.length;
    const aiCount =
      localPosts.filter((post) => post.theme === "AI-enabled engineering").length +
      writing.filter((entry) => entry.theme === "AI-enabled engineering").length;

    const all = screen.getByRole("button", { name: `All ${totalCount}` });
    const ai = screen.getByRole("button", { name: `AI-enabled engineering ${aiCount}` });

    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(within(all).getByText("✓")).toBeVisible();

    await user.click(ai);

    expect(ai).toHaveAttribute("aria-pressed", "true");
    expect(within(ai).getByText("✓")).toBeVisible();
    expect(within(all).queryByText("✓")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(`${aiCount} ${aiCount === 1 ? "result" : "results"}`);

    const links = within(screen.getByRole("list", { name: "Writing" })).getAllByRole("link");
    expect(links).toHaveLength(aiCount);
    expect(links[0]).toHaveAccessibleName(/The new era of static analysis/i);
  });

  it("shows each entry's theme as row metadata", () => {
    render(<PostsPage />);

    const externalPost = screen.getByRole("link", { name: /Scaling GraphQL at PayPal/i });
    const securityPost = screen.getByRole("link", { name: /Securing your JS apps w\/ Stateless CSRF/i });

    expect(within(externalPost).getByText("APIs & GraphQL")).toBeVisible();
    expect(within(securityPost).getByText("Web application security")).toBeVisible();
    expect(screen.getByRole("button", { name: "Web application security 1" })).toBeVisible();
  });
});
