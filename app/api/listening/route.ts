import { getHistory } from "@/lib/listening-store";
import { isSpotifyConfigured } from "@/lib/spotify";

export async function GET(request: Request) {
  if (!isSpotifyConfigured()) {
    return Response.json({ configured: false, items: [], nextBefore: null });
  }
  const params = new URL(request.url).searchParams;
  const beforeParam = params.get("before");
  const before = beforeParam ? Number(beforeParam) : undefined;
  if (beforeParam && !Number.isFinite(before)) {
    return Response.json({ error: "invalid cursor" }, { status: 400 });
  }
  try {
    const page = await getHistory(before, 30);
    return Response.json({ configured: true, ...page });
  } catch {
    return Response.json({ configured: true, items: [], nextBefore: null });
  }
}
