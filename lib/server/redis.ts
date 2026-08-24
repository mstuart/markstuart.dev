import { fetchWithTimeout } from "@/lib/server/http";

export type RedisValue = string | number | boolean | null;

export type RedisConfig = {
  url: string;
  token: string;
};

type RedisResponse<T> = {
  result?: T;
  error?: string;
};

export function redisConfig(): RedisConfig | null {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (kvUrl && kvToken) {
    return { url: kvUrl, token: kvToken };
  }

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    return { url: upstashUrl, token: upstashToken };
  }

  return null;
}

function configuredRedis(): RedisConfig {
  const config = redisConfig();
  if (!config) {
    throw new Error("Redis is not configured");
  }
  return config;
}

function requestHeaders(token: string): HeadersInit {
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
}

export async function redisCommand<T>(
  command: RedisValue[],
  options: { timeoutMs?: number } = {},
): Promise<T> {
  const config = configuredRedis();
  const response = await fetchWithTimeout(
    config.url,
    {
      method: "POST",
      headers: requestHeaders(config.token),
      body: JSON.stringify(command),
    },
    options.timeoutMs,
  );

  if (!response.ok) {
    throw new Error(`Redis request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as RedisResponse<T>;
  if (payload.error || !("result" in payload)) {
    throw new Error("Redis command failed");
  }
  return payload.result as T;
}

export async function redisPipeline<T>(commands: RedisValue[][]): Promise<T[]> {
  const config = configuredRedis();
  const response = await fetchWithTimeout(`${config.url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: requestHeaders(config.token),
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    throw new Error(`Redis request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (
    !Array.isArray(payload) ||
    payload.length !== commands.length ||
    payload.some(
      (entry) =>
        typeof entry !== "object" ||
        entry === null ||
        !("result" in entry) ||
        ("error" in entry && Boolean(entry.error)),
    )
  ) {
    throw new Error("Redis pipeline failed");
  }
  return payload.map((entry) => (entry as RedisResponse<T>).result as T);
}
