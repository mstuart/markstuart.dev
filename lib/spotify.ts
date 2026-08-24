import { unstable_cache } from "next/cache";
import { fetchWithTimeout } from "@/lib/server/http";

// Spotify Web API client using the authorization-code refresh token flow.
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";
const SPOTIFY_TIMEOUT_MS = 5000;

export type SpotifyResult<T> =
  | { status: "ok"; data: T }
  | {
      status: "unavailable";
      reason: "not_configured" | "spotify_unavailable" | "history_unavailable";
    };

export interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  image?: string;
  url?: string;
}

export interface PlayedTrack extends SpotifyTrack {
  /** ISO timestamp of when the track was played. */
  playedAt: string;
}

export interface NowPlaying extends SpotifyTrack {
  isPlaying: boolean;
}

export function isSpotifyConfigured(): boolean {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID &&
      process.env.SPOTIFY_CLIENT_SECRET &&
      process.env.SPOTIFY_REFRESH_TOKEN
  );
}

export class SpotifyUnavailableError extends Error {
  constructor() {
    super("Spotify is unavailable");
    this.name = "SpotifyUnavailableError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function httpsUrl(value: unknown): string | undefined {
  if (!isNonEmptyString(value)) return undefined;
  try {
    return new URL(value).protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new SpotifyUnavailableError();
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null;
let tokenPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
  const response = await fetchWithTimeout(
    TOKEN_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: process.env.SPOTIFY_REFRESH_TOKEN ?? "",
      }),
      cache: "no-store",
    },
    SPOTIFY_TIMEOUT_MS
  );
  if (!response.ok) throw new SpotifyUnavailableError();
  const data = await readJson(response);
  if (
    !isRecord(data) ||
    !isNonEmptyString(data.access_token) ||
    typeof data.expires_in !== "number" ||
    !Number.isFinite(data.expires_in) ||
    data.expires_in <= 0
  ) {
    throw new SpotifyUnavailableError();
  }
  const expiresAt = Date.now() + data.expires_in * 1000;
  if (!Number.isFinite(expiresAt)) throw new SpotifyUnavailableError();
  cachedToken = { value: data.access_token, expiresAt };
  return cachedToken.value;
}

async function accessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) return cachedToken.value;
  if (!tokenPromise) {
    tokenPromise = refreshAccessToken().finally(() => {
      tokenPromise = null;
    });
  }
  return tokenPromise;
}

interface SpotifyImage {
  url: string;
  width: number;
}

export function selectImage(images: SpotifyImage[], minimumWidth: number): SpotifyImage | undefined {
  const sorted = [...images].sort((a, b) => a.width - b.width);
  return sorted.find((image) => image.width >= minimumWidth) ?? sorted[0];
}

interface RawTrack {
  name: string;
  artists: string[];
  album: string;
  images: SpotifyImage[];
  url?: string;
}

function parseImages(value: unknown): SpotifyImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((image) => {
    if (!isRecord(image)) return [];
    const url = httpsUrl(image.url);
    if (
      !url ||
      typeof image.width !== "number" ||
      !Number.isFinite(image.width) ||
      image.width <= 0
    ) {
      return [];
    }
    return [{ url, width: image.width }];
  });
}

function parseExternalUrl(value: unknown): string | undefined {
  return isRecord(value) ? httpsUrl(value.spotify) : undefined;
}

function parseTrack(value: unknown): RawTrack {
  if (!isRecord(value) || !isNonEmptyString(value.name) || !Array.isArray(value.artists)) {
    throw new SpotifyUnavailableError();
  }
  const artists = value.artists.map((artist) => {
    if (!isRecord(artist) || !isNonEmptyString(artist.name)) {
      throw new SpotifyUnavailableError();
    }
    return artist.name;
  });
  if (artists.length === 0 || !isRecord(value.album) || !isNonEmptyString(value.album.name)) {
    throw new SpotifyUnavailableError();
  }
  return {
    name: value.name,
    artists,
    album: value.album.name,
    images: parseImages(value.album.images),
    url: parseExternalUrl(value.external_urls),
  };
}

function parseItems(value: unknown): unknown[] {
  if (!isRecord(value) || !Array.isArray(value.items)) throw new SpotifyUnavailableError();
  return value.items;
}

function toTrack(raw: RawTrack, cssWidth: number): SpotifyTrack {
  const image = selectImage(raw.images, cssWidth * 2);
  return {
    name: raw.name,
    artist: raw.artists.join(", "),
    album: raw.album,
    image: image?.url,
    url: raw.url,
  };
}

async function spotifyGet(path: string): Promise<Response> {
  const token = await accessToken();
  const response = await fetchWithTimeout(
    `${API}${path}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    SPOTIFY_TIMEOUT_MS
  );
  if (!response.ok) throw new SpotifyUnavailableError();
  return response;
}

export async function getNowPlaying(): Promise<NowPlaying | null> {
  if (!isSpotifyConfigured()) return null;
  const token = await accessToken();
  const response = await fetchWithTimeout(
    `${API}/me/player/currently-playing`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    SPOTIFY_TIMEOUT_MS
  );
  if (response.status === 204) return null;
  if (!response.ok) throw new SpotifyUnavailableError();
  const data = await readJson(response);
  if (!isRecord(data) || typeof data.is_playing !== "boolean" || !("item" in data)) {
    throw new SpotifyUnavailableError();
  }
  if (data.item === null) return null;
  return { ...toTrack(parseTrack(data.item), 64), isPlaying: data.is_playing };
}

export async function getRecentlyPlayed(limit = 50): Promise<PlayedTrack[]> {
  if (!isSpotifyConfigured()) return [];
  const response = await spotifyGet(`/me/player/recently-played?limit=${limit}`);
  return parseItems(await readJson(response)).map((item) => {
    if (!isRecord(item) || !isNonEmptyString(item.played_at)) {
      throw new SpotifyUnavailableError();
    }
    const playedAt = Date.parse(item.played_at);
    if (!Number.isFinite(playedAt) || new Date(playedAt).toISOString() !== item.played_at) {
      throw new SpotifyUnavailableError();
    }
    return { ...toTrack(parseTrack(item.track), 32), playedAt: item.played_at };
  });
}

export interface TopArtist {
  name: string;
  image?: string;
  url?: string;
  genres: string[];
}

function parseTopArtist(value: unknown): TopArtist {
  if (!isRecord(value) || !isNonEmptyString(value.name)) {
    throw new SpotifyUnavailableError();
  }
  const genres = value.genres ?? [];
  if (!Array.isArray(genres) || !genres.every(isNonEmptyString)) {
    throw new SpotifyUnavailableError();
  }
  return {
    name: value.name,
    image: selectImage(parseImages(value.images), 112)?.url,
    url: parseExternalUrl(value.external_urls),
    genres,
  };
}

const loadTopTracks = unstable_cache(
  async (limit: number): Promise<SpotifyTrack[]> => {
    const response = await spotifyGet(`/me/top/tracks?limit=${limit}&time_range=long_term`);
    return parseItems(await readJson(response)).map((track) => toTrack(parseTrack(track), 32));
  },
  ["spotify-top-tracks"],
  { revalidate: 10_800 }
);

const loadTopArtists = unstable_cache(
  async (limit: number): Promise<TopArtist[]> => {
    const response = await spotifyGet(`/me/top/artists?limit=${limit}&time_range=long_term`);
    return parseItems(await readJson(response)).map(parseTopArtist);
  },
  ["spotify-top-artists"],
  { revalidate: 10_800 }
);

// Top items use Spotify's long_term range (roughly the last year). Each
// transformed result is shared for three hours, independent of auth headers.
export async function getTopTracks(limit = 10): Promise<SpotifyTrack[]> {
  if (!isSpotifyConfigured()) return [];
  return loadTopTracks(limit);
}

export async function getTopArtists(limit = 50): Promise<TopArtist[]> {
  if (!isSpotifyConfigured()) return [];
  return loadTopArtists(limit);
}
