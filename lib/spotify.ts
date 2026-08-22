// Spotify Web API client using the authorization-code refresh token flow.
// Requires SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
// (mint the refresh token once with scripts/spotify-setup.mjs).

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

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

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.value;
  }
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch(TOKEN_URL, {
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
  });
  if (!res.ok) throw new Error(`spotify token refresh failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

interface RawTrack {
  name: string;
  external_urls?: { spotify?: string };
  artists?: Array<{ name: string }>;
  album?: { name?: string; images?: Array<{ url: string; width: number }> };
}

function toTrack(raw: RawTrack): SpotifyTrack {
  const images = raw.album?.images ?? [];
  const image = images.find((img) => img.width <= 300) ?? images[images.length - 1];
  return {
    name: raw.name,
    artist: (raw.artists ?? []).map((a) => a.name).join(", "),
    album: raw.album?.name ?? "",
    image: image?.url,
    url: raw.external_urls?.spotify,
  };
}

export async function getNowPlaying(): Promise<NowPlaying | null> {
  if (!isSpotifyConfigured()) return null;
  const token = await accessToken();
  const res = await fetch(`${API}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });
  if (res.status === 204 || !res.ok) return null;
  const data = (await res.json()) as { is_playing: boolean; item: RawTrack | null };
  if (!data.item) return null;
  return { ...toTrack(data.item), isPlaying: data.is_playing };
}

export async function getRecentlyPlayed(limit = 50): Promise<PlayedTrack[]> {
  if (!isSpotifyConfigured()) return [];
  const token = await accessToken();
  const res = await fetch(`${API}/me/player/recently-played?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    items: Array<{ track: RawTrack; played_at: string }>;
  };
  return data.items.map((item) => ({ ...toTrack(item.track), playedAt: item.played_at }));
}

export interface TopArtist {
  name: string;
  image?: string;
  url?: string;
  genres: string[];
}

// Top items use Spotify's long_term range (roughly the last year) and are
// cached for 3 hours, shared across all visitors, to protect API quota.
export async function getTopTracks(limit = 10): Promise<SpotifyTrack[]> {
  if (!isSpotifyConfigured()) return [];
  const token = await accessToken();
  const res = await fetch(`${API}/me/top/tracks?limit=${limit}&time_range=long_term`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 10800 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { items: RawTrack[] };
  return data.items.map(toTrack);
}

export async function getTopArtists(limit = 50): Promise<TopArtist[]> {
  if (!isSpotifyConfigured()) return [];
  const token = await accessToken();
  const res = await fetch(`${API}/me/top/artists?limit=${limit}&time_range=long_term`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 10800 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    items: Array<{
      name: string;
      genres?: string[];
      external_urls?: { spotify?: string };
      images?: Array<{ url: string; width: number }>;
    }>;
  };
  return data.items.map((artist) => {
    const images = artist.images ?? [];
    const image = images.find((img) => img.width <= 320) ?? images[images.length - 1];
    return {
      name: artist.name,
      image: image?.url,
      url: artist.external_urls?.spotify,
      genres: artist.genres ?? [],
    };
  });
}
