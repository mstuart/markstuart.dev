import { afterEach, describe, expect, it, vi } from "vitest";

import {
  VoteRateLimitExceededError,
  addVote,
  getVoteState,
} from "@/lib/votes-store";

const REDIS_ENV_KEYS = [
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

afterEach(() => {
  for (const key of REDIS_ENV_KEYS) {
    delete process.env[key];
  }
  vi.unstubAllGlobals();
});

describe("votes store", () => {
  it("returns the authoritative state when an existing voter retries", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    const results = [
      Response.json({ result: [1, 1, "added"] }),
      Response.json({ result: [1, 1, "existing"] }),
    ];
    const fetchMock = vi.fn(
      async () => results.shift() ?? Response.json({ result: [1, 1, "existing"] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(addVote("hello-world", "voter-a")).resolves.toEqual({ votes: 1, voted: true });
    await expect(addVote("hello-world", "voter-a")).resolves.toEqual({ votes: 1, voted: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uses bounded idempotency bits without shrinking totals and migrates legacy voters", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    const seen = new Set<string>();
    const legacyVoters = new Set(["legacy-old-voter"]);
    const clientVoters = new Map<string, Set<string>>();
    let totalVotes = 20_000;
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const command = JSON.parse(String(init?.body)) as (string | number)[];
      const keys = command.slice(3, 3 + Number(command[2]));
      if (!keys.includes("votes:hello-world")) {
        throw new Error("The rolling identity window must not replace the durable vote total");
      }
      if (keys[0] !== "votes:voters:v3:hello-world") {
        throw new Error("Voter idempotency must use the bounded bitmap store");
      }
      const argumentStart = 3 + Number(command[2]);
      const bits = command.slice(argumentStart, argumentStart + 3).join(":");
      if (Number(command[2]) === 3) {
        const legacyVoter = String(command[argumentStart + 3]);
        const voted = seen.has(bits) || legacyVoters.has(legacyVoter);
        if (legacyVoters.has(legacyVoter)) seen.add(bits);
        return Response.json({ result: [totalVotes, voted ? 1 : 0] });
      }
      if (Number(command[2]) !== 4) return Response.json({ result: [0, 0, "unsupported", 0] });

      const voter = String(command[argumentStart + 3]);
      const clientKey = String(command[4]);
      const clientCapacity = Number(command[argumentStart + 4]);
      const legacyVoter = String(command[argumentStart + 6]);
      if (seen.has(bits) || legacyVoters.has(legacyVoter)) {
        seen.add(bits);
        return Response.json({ result: [totalVotes, 1, "existing", 0] });
      }

      const client = clientVoters.get(clientKey) ?? new Set<string>();
      if (client.size >= clientCapacity) {
        return Response.json({ result: [totalVotes, 0, "client_limit", 90] });
      }
      seen.add(bits);
      client.add(voter);
      clientVoters.set(clientKey, client);
      totalVotes += 1;
      return Response.json({ result: [totalVotes, 1, "added", 0] });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(addVote("hello-world", "new-voter", "client-a", "legacy-new-voter")).resolves.toEqual({
      votes: 20_001,
      voted: true,
    });
    await expect(getVoteState("hello-world", "new-voter", "legacy-new-voter")).resolves.toEqual({
      votes: 20_001,
      voted: true,
    });

    await expect(addVote("hello-world", "next-voter", "client-b")).resolves.toEqual({
      votes: 20_002,
      voted: true,
    });
    await expect(addVote("hello-world", "next-voter", "client-b")).resolves.toEqual({
      votes: 20_002,
      voted: true,
    });

    await expect(getVoteState("hello-world", "hashed-old-voter", "legacy-old-voter")).resolves.toEqual({
      votes: 20_002,
      voted: true,
    });
    await expect(
      addVote("hello-world", "hashed-old-voter", "client-old", "legacy-old-voter"),
    ).resolves.toEqual({ votes: 20_002, voted: true });

    clientVoters.set("votes:abuse:hello-world:client-c", new Set(["a", "b", "c"]));
    await expect(addVote("hello-world", "limited-voter", "client-c")).rejects.toBeInstanceOf(
      VoteRateLimitExceededError,
    );
    await expect(addVote("hello-world", "limited-voter", "client-c")).rejects.toMatchObject({
      retryAfter: 90,
    });

    expect(fetchMock).toHaveBeenCalled();
  });

  it("returns whether the voter has already voted", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const command = JSON.parse(String(init?.body)) as string[];
        return Response.json({ result: command[0] === "EVAL" ? [4, 1] : 0 });
      }),
    );

    await expect(getVoteState("hello-world", "voter-a")).resolves.toEqual({ votes: 4, voted: true });
  });
});
