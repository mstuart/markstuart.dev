import { afterEach, describe, expect, it, vi } from "vitest";

import { addVote, getVoteState } from "@/lib/votes-store";

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
  it("uses one atomic Redis command to increment once for the same voter and slug", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    const voters = new Set<string>();
    let votes = 0;
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const command = JSON.parse(String(init?.body)) as (string | number)[];
        expect(command[0]).toBe("EVAL");
        expect(command[1]).toContain("redis.call('SADD'");
        expect(command[1]).toContain("redis.call('INCR'");
        expect(command[2]).toBe(2);
        expect(command[3]).toBe("votes:voters:hello-world");
        expect(command[4]).toBe("votes:hello-world");
        const voterKey = `${command[3]}:${command[5]}`;
        const added = voters.has(voterKey) ? 0 : 1;
        voters.add(voterKey);
        if (added === 1) votes += 1;
        return Response.json({ result: [votes, 1] });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(addVote("hello-world", "voter-a")).resolves.toEqual({ votes: 1, voted: true });
    await expect(addVote("hello-world", "voter-a")).resolves.toEqual({ votes: 1, voted: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns whether the voter has already voted", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const command = JSON.parse(String(init?.body)) as string[];
        return Response.json({ result: command[0] === "SISMEMBER" ? 1 : 4 });
      }),
    );

    await expect(getVoteState("hello-world", "voter-a")).resolves.toEqual({ votes: 4, voted: true });
  });
});
