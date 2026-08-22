// Hand-authored pixel maps for the "scene-5" hero motif: a poster-style
// portrait of a cool cat in an oversized hoodie, chest-up, angled left with
// its head in near-profile. Three signature props carry the joke: teal
// wayfarer sunglasses, teal headphones worn loose around the neck, and a
// teal speech-bubble (top-right) holding a steaming coffee mug.
//
// Each map is a string array. Every character is a palette key:
//   "." = empty (not drawn)
//   "O" = outline (fur silhouette, sunglasses/headphone/mug trim)
//   "F" = fur fill (head, ears, muzzle, cheek, neck)
//   "H" = hoodie fill (chest/shoulder mass)
//   "L" = hoodie fold line (bunched fabric crease)
//   "A" = accent teal (sunglasses, headphone band+cup, speech bubble)
//   "M" = mug (cream, near-white in both themes)
//   "G" = ground band (secondary background tone)
export type PaletteKey = "." | "O" | "F" | "H" | "L" | "A" | "M" | "G";

export const CELL = 4;

// Overall canvas grid. At CELL=4 this is a 136x176px canvas, matching the
// ~136x176px poster footprint reserved in the hero header.
export const GRID_COLS = 34;
export const GRID_ROWS = 44;

// Full-canvas silhouette: two pointed ears, brow, a stepped muzzle (the
// cat "stop"), chin, jaw into a bare neck, then the hoodie's bunched
// collar opening into the big chest mass. Sunglasses and the headphone
// band are baked in here since neither one animates.
export const CAT_MAP: readonly string[] = [
  "..................................",
  "..................................",
  "..................................",
  ".............O....................",
  "............OFO...................",
  "...........OFFFO..................",
  "..........OFFFFFO..O..............",
  ".........OFFFFFFFOOFO.............",
  ".........OFFFFFFFFFFO.............",
  "........OFFFFFFFFFFFFO............",
  ".......OFFFFFFFFFFFFFFO...........",
  ".......OFFFFFFFFFFFFFFFO..........",
  ".......OFOOOOOOOOOOOOFFFFFO.......",
  "......OFOOOOOOOOOOOOOOOFFFFFO.....",
  "......OFOAAAAAAAAAAAAAOFFFFFO.....",
  "......OFOAAAAAAAAAAAAAOFFFFFO.....",
  ".....OFFOOOOOOOOOOOOOOOFFFFFO.....",
  "...OFFFFFFFFFFFFFFFFFFFFFFFFO.....",
  "..OFFFFFFFFFFFFFFFFFFFFFFFFFO.....",
  "..OFOFFFFFFFFFFFFFFFFFFFFFFFO.....",
  "...OFOFFFFFFFFFFFFFFFFFFFFFO......",
  "....OFFFFFFFFFFFFFFFFFFFFFFO......",
  ".....OFFFFFFFFFFFFFFFFFFFFO.......",
  ".......OFFFFFFFFFFFFFFFFFO........",
  ".........OFFFFFFFFFFFFFFFO........",
  ".........OAAAAAAAAAAAAAAAO........",
  ".........OAAAAAAAAAAAAAAAO........",
  "......OHHHHLHHHHHHHHHLHHHHHHO.....",
  "....OHHHHLHHHHHHHHHHHHHHLHHHHHHO..",
  "...OHHHHHHHHHHHOOOHHHHHHHHHHHHHHO.",
  "..OHHHHHHHHHHHOAAAOHHHHHHHHHHHO...",
  ".OHHHHHHHHHHHOAAAAAOHHHHHHHHHO....",
  "OHHHHHHHHHHHHOAAAAAOHHHHHHHHHO....",
  "OHHHHHHHHHHHHHOAAAOHHHHHHHHHO.....",
  "OHHHHHHHHHHHHHHOOOHHHHHHHHHO......",
  "OHHHHHHHHHHHHHHHHHHHHHHHHHHO......",
  "OHHHHHHHHHHHHHHHHHHHHHHHHHO.......",
  "OHHHHHHHHHHHHHHHHHHHHHHHHO........",
  ".OHHHHHHHHHHHHHHHHHHHHHHO.........",
  ".OHHHHHHHHHHHHHHHHHHHHO...........",
  ".OHHHHHHHHHHHHHHHHHHHO............",
  ".OHHHHHHHHHHHHHHHHHHO.............",
  ".OHHHHHHHHHHHHHHHHHO..............",
  ".OHHHHHHHHHHHHHHHHHO..............",
];

export const CAT_ORIGIN = { col: 0, row: 0 };

// Speech bubble (top-right), its down-left tail, and the mug it holds.
// Steam is layered separately so it can animate on its own.
export const SPEECH_MAP: readonly string[] = [
  "........A......",
  ".....AAAAAAA...",
  "....AAAAAAAAA..",
  "...AAAAAAAAAAA.",
  "..AAAAAAAAAAAAA",
  "..AAAAAAAAAAAAA",
  "..AAAAAAAAAAAAA",
  "..AAAOOOAAAAAAA",
  "..AAOMMMOAAAAAA",
  "...AOMMMOOAAAA.",
  "....OMMMOAAAA..",
  ".....OOOAAAA...",
  "........A......",
  ".......A.......",
  "......A........",
  ".....A.........",
];

export const SPEECH_ORIGIN = { col: 19, row: 0 };

// Three steam wisps drifting above the mug, each a single quiet pixel
// that rises over three frames (staggered so they feel independent
// rather than one wisp animating).
export const STEAM_FRAMES: readonly (readonly [number, number])[][] = [
  [
    [23, 5],
    [26, 3],
    [29, 4],
  ],
  [
    [23, 4],
    [26, 2],
    [29, 3],
  ],
  [
    [23, 3],
    [26, 1],
    [29, 2],
  ],
];

// One-shot glint: a single highlight pixel sweeping left-to-right across
// the sunglasses lens. Played once per cycle, then rests.
export const GLINT_PATH: readonly (readonly [number, number])[] = [
  [9, 14],
  [11, 15],
  [13, 14],
  [15, 15],
  [17, 14],
  [19, 15],
  [21, 14],
];

// Diagonal ground band: the row (per column) where the band begins,
// stepped in a hand-drawn staircase rather than a smooth ramp. Spans
// only the lower quarter of the canvas (rows 33-43 at its highest).
export const GROUND_TOP_ROW: readonly number[] = [
  38, 38, 38, 38, 38, 38, 37, 37, 37, 37, 37, 36, 36, 36, 36, 36, 35, 35, 35,
  35, 35, 34, 34, 34, 34, 34, 33, 33, 33, 33, 33, 33, 33, 33,
];
