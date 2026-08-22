import { getAllPosts } from "@/lib/posts";
import { addVote, getVotes } from "@/lib/votes-store";

// Only known post slugs are valid vote keys.
function isValidSlug(slug: string | null): slug is string {
  if (!slug) return false;
  return getAllPosts().some((post) => post.slug === slug);
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!isValidSlug(slug)) {
    return Response.json({ error: "unknown slug" }, { status: 400 });
  }
  return Response.json({ votes: await getVotes(slug) });
}

export async function POST(request: Request) {
  let slug: string | null = null;
  try {
    const body = (await request.json()) as { slug?: string };
    slug = body.slug ?? null;
  } catch {
    slug = null;
  }
  if (!isValidSlug(slug)) {
    return Response.json({ error: "unknown slug" }, { status: 400 });
  }
  return Response.json({ votes: await addVote(slug) });
}
