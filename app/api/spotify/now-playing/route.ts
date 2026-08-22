import { getNowPlaying, isSpotifyConfigured } from "@/lib/spotify";

export async function GET() {
  if (!isSpotifyConfigured()) {
    return Response.json({ configured: false, isPlaying: false });
  }
  try {
    const nowPlaying = await getNowPlaying();
    return Response.json({ configured: true, isPlaying: false, ...nowPlaying });
  } catch {
    return Response.json({ configured: true, isPlaying: false });
  }
}
