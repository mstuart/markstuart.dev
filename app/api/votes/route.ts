import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { getAllPosts } from "@/lib/posts";
import {
  VoteRateLimitExceededError,
  VoteStoreNotConfiguredError,
  addVote,
  consumeVoteRateLimit,
  getVoteState,
} from "@/lib/votes-store";
import { publicError } from "@/lib/server/http";
import { logServerError } from "@/lib/server/log";

const VOTER_COOKIE = "mark-voter";
const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class VoteSigningNotConfiguredError extends Error {}

// Only known post slugs are valid vote keys. A post's previous slugs stay
// valid so links published before a rename keep working.
function isValidSlug(slug: string | null): slug is string {
  if (!slug) return false;
  return getAllPosts().some(
    (post) => post.slug === slug || (post.previousSlugs ?? []).includes(slug),
  );
}

// Existing votes live under the slug a post was first published as. Map any
// current-or-previous slug to that canonical key so a rename preserves the
// count and voter dedup instead of stranding them under the old slug.
function voteStorageSlug(slug: string): string {
  const post = getAllPosts().find(
    (candidate) => candidate.slug === slug || (candidate.previousSlugs ?? []).includes(slug),
  );
  return post?.previousSlugs?.[0] ?? slug;
}

function voteSecret(): string {
  const secret = process.env.VOTE_SECRET;
  if (!secret) throw new VoteSigningNotConfiguredError();
  return secret;
}

function signature(voterId: string): string {
  return createHmac("sha256", voteSecret()).update(voterId).digest("hex");
}

function voteFingerprint(scope: "voter" | "abuse", slug: string, value: string): string {
  return createHmac("sha256", voteSecret())
    .update(`vote-${scope}\\0${slug}\\0${value}`)
    .digest("hex");
}

function clientAbuseFingerprint(request: Request, slug: string): string {
  const client =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return voteFingerprint("abuse", slug, client.slice(0, 256));
}

function parseCookie(request: Request, name: string): string | null {
  const value = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function verifiedVoterId(request: Request): string | null {
  const value = parseCookie(request, VOTER_COOKIE);
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator === -1) return null;

  const voterId = value.slice(0, separator);
  const suppliedSignature = value.slice(separator + 1);
  if (!UUID_PATTERN.test(voterId) || !/^[0-9a-f]{64}$/i.test(suppliedSignature)) {
    return null;
  }

  const expectedSignature = Buffer.from(signature(voterId), "hex");
  const actualSignature = Buffer.from(suppliedSignature, "hex");
  return actualSignature.length === expectedSignature.length &&
    timingSafeEqual(actualSignature, expectedSignature)
    ? voterId
    : null;
}

function voterIdentity(request: Request): { voterId: string; setCookie?: string } {
  const existingVoterId = verifiedVoterId(request);
  if (existingVoterId) return { voterId: existingVoterId };

  const voterId = randomUUID();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return {
    voterId,
    setCookie: `${VOTER_COOKIE}=${voterId}.${signature(voterId)}; Path=/; Max-Age=${VOTER_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`,
  };
}

function jsonWithVoterCookie(body: unknown, setCookie?: string): Response {
  const response = Response.json(body);
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}

function invalidSlugResponse(): Response {
  return publicError("unknown_slug", 400, randomUUID());
}

function isJsonRequest(request: Request): boolean {
  return request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  return (
    origin === new URL(request.url).origin &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}

function voteFailure(error: unknown, operation: "get_votes" | "add_vote"): Response {
  const correlationId = randomUUID();
  if (error instanceof VoteRateLimitExceededError) {
    const response = publicError("vote_rate_limited", 429, correlationId);
    response.headers.set("Retry-After", String(error.retryAfter));
    return response;
  }
  if (error instanceof VoteStoreNotConfiguredError || error instanceof VoteSigningNotConfiguredError) {
    return publicError("not_configured", 503, correlationId);
  }
  logServerError({ correlationId, operation, provider: "redis", error });
  return publicError("vote_failed", 500, correlationId);
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!isValidSlug(slug)) return invalidSlugResponse();
  const storeSlug = voteStorageSlug(slug);

  try {
    const voter = voterIdentity(request);
    return jsonWithVoterCookie(
      await getVoteState(storeSlug, voteFingerprint("voter", storeSlug, voter.voterId), voter.voterId),
      voter.setCookie,
    );
  } catch (error) {
    return voteFailure(error, "get_votes");
  }
}

export async function POST(request: Request) {
  if (!isJsonRequest(request)) {
    return publicError("unsupported_media_type", 415, randomUUID());
  }
  if (!isSameOriginRequest(request)) {
    return publicError("cross_site_request", 403, randomUUID());
  }

  let slug: string | null = null;
  try {
    const body = (await request.json()) as { slug?: unknown };
    slug = typeof body.slug === "string" ? body.slug : null;
  } catch {
    // A malformed request has no valid slug.
  }
  if (!isValidSlug(slug)) return invalidSlugResponse();
  const storeSlug = voteStorageSlug(slug);

  try {
    const existingVoterId = verifiedVoterId(request);
    const client = clientAbuseFingerprint(request, storeSlug);
    if (!existingVoterId) {
      const rateLimit = await consumeVoteRateLimit(storeSlug, client);
      if (!rateLimit.allowed) {
        const response = publicError("vote_rate_limited", 429, randomUUID());
        response.headers.set("Retry-After", String(rateLimit.retryAfter));
        return response;
      }
    }
    const voter = voterIdentity(request);
    return jsonWithVoterCookie(
      await addVote(storeSlug, voteFingerprint("voter", storeSlug, voter.voterId), client, voter.voterId),
      voter.setCookie,
    );
  } catch (error) {
    return voteFailure(error, "add_vote");
  }
}
