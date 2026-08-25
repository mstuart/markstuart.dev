import { describe, expect, it } from "vitest";
import { GET } from "@/app/feed.xml/route";
import { writing } from "@/lib/data/writing";

describe("RSS feed", () => {
  it("publishes author, source categories, and authored summaries", async () => {
    const response = GET();
    const xml = await response.text();

    expect(response.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8");
    expect(xml).toContain("xmlns:dc=\"http://purl.org/dc/elements/1.1/\"");
    expect(xml).toContain("<dc:creator>Mark Stuart</dc:creator>");
    expect(xml).toContain("<category>Rocket Technology Blog</category>");
    expect(xml).toContain("<category>PayPal Technology Blog</category>");
    expect(xml).toContain(
      "How AI-authored static analysis can turn natural-language engineering rules into deterministic code enforcement."
    );
    expect(xml).not.toContain("Published on the");
  });

  it("rejects an external entry without an authored summary", () => {
    writing.push({
      title: "Future external article",
      date: "2026-08-23",
      url: "https://example.com/future-external-article",
      source: "Rocket Technology Blog",
    });

    try {
      expect(() => GET()).toThrow(
        "Missing authored RSS summary for https://example.com/future-external-article"
      );
    } finally {
      writing.pop();
    }
  });
});
