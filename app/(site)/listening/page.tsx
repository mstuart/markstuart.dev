import type { Metadata } from "next";
import { ArrowUpRight, MusicNotes, User } from "@phosphor-icons/react/dist/ssr";
import { NowPlayingCard, RecentlyPlayed } from "@/components/listening-feed";
import { getTopArtists, getTopTracks, isSpotifyConfigured } from "@/lib/spotify";

export const metadata: Metadata = {
  title: "Listening",
  description: "What I've been playing on Spotify.",
};

// Top sections re-render at most every 3 hours; visitors share the cache.
export const revalidate = 10800;

function topGenres(genreLists: string[][], count: number): Array<{ name: string; total: number }> {
  const tally = new Map<string, number>();
  for (const genres of genreLists) {
    for (const genre of genres) {
      tally.set(genre, (tally.get(genre) ?? 0) + 1);
    }
  }
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([name, total]) => ({ name, total }));
}

export default async function ListeningPage() {
  const configured = isSpotifyConfigured();
  const [artists, tracks] = configured
    ? await Promise.all([getTopArtists(50), getTopTracks(10)])
    : [[], []];
  const genres = topGenres(artists.map((artist) => artist.genres), 10);
  const featuredArtists = artists.slice(0, 8);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-medium text-zinc-900 dark:text-zinc-100">Listening</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        What I&apos;ve been playing on Spotify, synced every hour.
      </p>

      <NowPlayingCard />

      {featuredArtists.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
            Top artists, last year
          </h2>
          <div className="mt-4 grid grid-cols-4 gap-x-4 gap-y-6 sm:grid-cols-8 sm:gap-x-3">
            {featuredArtists.map((artist) => (
              <a
                key={artist.name}
                href={artist.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-2 rounded-md text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400"
              >
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-zinc-100/10">
                  {artist.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artist.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User size={20} className="text-zinc-400 dark:text-zinc-500" />
                  )}
                </span>
                <span className="w-full truncate text-xs text-zinc-500 transition-colors group-hover:text-teal-600 dark:text-zinc-400 dark:group-hover:text-teal-400">
                  {artist.name}
                </span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {tracks.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
            Top songs, last year
          </h2>
          <ul className="mt-4 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {tracks.map((track, index) => (
              <li key={`${track.name}-${track.artist}`}>
                <a
                  href={track.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-md px-2 py-2.5 -mx-2 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:hover:bg-zinc-900 dark:focus-visible:ring-teal-400"
                >
                  <span className="w-5 shrink-0 text-right font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                    {index + 1}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-zinc-100/10">
                    {track.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={track.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <MusicNotes size={14} className="text-zinc-400 dark:text-zinc-500" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 truncate text-sm text-zinc-900 transition-colors group-hover:text-teal-600 dark:text-zinc-100 dark:group-hover:text-teal-400">
                        <span className="truncate">{track.name}</span>
                        <ArrowUpRight
                          size={12}
                          weight="regular"
                          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </span>
                      <span className="block truncate text-sm text-zinc-500 dark:text-zinc-400">
                        {track.artist}
                      </span>
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {genres.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
            Top genres, last year
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {genres.map((genre) => (
              <span
                key={genre.name}
                className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {genre.name}
                <span className="font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                  {genre.total}
                </span>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <RecentlyPlayed />
    </div>
  );
}
