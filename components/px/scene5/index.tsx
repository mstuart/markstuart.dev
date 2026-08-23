/* Poster cat: Mark's own artwork (8-bit majority-vote derivation of his
   original file, 56x64 grid at 8x = 448px, crisp integer scaling).
   Rendered as a large faded background element in the page's upper right,
   dissolving toward the content, with a faint scanline pass. */

const fadeMask =
  "radial-gradient(130% 120% at 100% 0%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 78%)";

export function PixelScene5() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 right-0 -z-10 hidden select-none overflow-hidden sm:block"
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/poster-cat-8bit.png"
          alt=""
          width={480}
          height={546}
          className="h-[546px] w-[480px] max-w-none opacity-35 dark:opacity-25"
          style={{
            imageRendering: "pixelated",
            maskImage: fadeMask,
            WebkitMaskImage: fadeMask,
          }}
        />
        <div
          className="absolute inset-0 opacity-30 dark:opacity-40"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 4px)",
            maskImage: fadeMask,
            WebkitMaskImage: fadeMask,
          }}
        />
      </div>
    </div>
  );
}
