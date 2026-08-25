import path from "node:path";
import { afterAll, beforeAll } from "vitest";

// Point lib/posts at the checked-in fixture post for the current describe
// scope, so content-dependent tests (votes, RSS, SEO, homepage, writing page)
// exercise a stable post regardless of what lives in the real content/posts
// directory. Restores the previous value afterward.
export function useFixturePosts(): void {
  const fixtureDir = path.resolve(process.cwd(), "tests/fixtures/posts");
  let previous: string | undefined;

  beforeAll(() => {
    previous = process.env.MARKSTUART_POSTS_DIR;
    process.env.MARKSTUART_POSTS_DIR = fixtureDir;
  });

  afterAll(() => {
    if (previous === undefined) {
      delete process.env.MARKSTUART_POSTS_DIR;
    } else {
      process.env.MARKSTUART_POSTS_DIR = previous;
    }
  });
}
