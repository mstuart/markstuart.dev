import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PostShareLinks } from "@/components/post-share-links";

const article = {
  title: "jQuery: the compatibility layer that shaped the web",
  url: "https://markstuart.dev/posts/jquery-universal-browser-api",
};

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, "execCommand");
});

describe("PostShareLinks", () => {
  it("builds X and LinkedIn share links from the canonical article URL", () => {
    render(<PostShareLinks {...article} />);

    expect(screen.getByRole("link", { name: "Share on X" })).toHaveAttribute(
      "href",
      "https://twitter.com/intent/tweet?text=jQuery%3A+the+compatibility+layer+that+shaped+the+web&url=https%3A%2F%2Fmarkstuart.dev%2Fposts%2Fjquery-universal-browser-api",
    );
    expect(screen.getByRole("link", { name: "Share on LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fmarkstuart.dev%2Fposts%2Fjquery-universal-browser-api",
    );
  });

  it("copies the canonical article URL and reports success", async () => {
    const user = userEvent.setup();
    render(<PostShareLinks {...article} />);

    await user.click(screen.getByRole("button", { name: "Copy link" }));

    expect(await navigator.clipboard.readText()).toBe(article.url);
    expect(screen.getByRole("button", { name: "Link copied" })).toBeInTheDocument();
  });

  it("uses the document copy command when the Clipboard API does not complete", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(new Promise(() => {}));
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });
    render(<PostShareLinks {...article} />);

    await user.click(screen.getByRole("button", { name: "Copy link" }));

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(screen.getByRole("button", { name: "Link copied" })).toBeInTheDocument();
  });
});
