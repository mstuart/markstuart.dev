// Pixel data for the "glitch decode" monogram: a 5x7 letterform grid per
// character, laid out on an 11x11 lattice that exactly fills the 56x56
// tile (10 * PITCH + PIXEL_SIZE + 2 * ORIGIN = 56). Non-glyph lattice
// cells are the candidate positions for scramble-frame noise pixels, so
// noise and glyph share one grid and nothing drifts between decode
// frames.

export const TILE_SIZE = 56;
export const PIXEL_SIZE = 4;
export const GAP = 1;
export const PITCH = PIXEL_SIZE + GAP; // 5
export const LATTICE_SIZE = 11; // cols === rows
export const ORIGIN = 1; // px margin so the lattice centers in the tile

// Logical letterform grid: 5 columns x 7 rows, "X" is a lit pixel.
// Same glyphs as the dot-matrix monogram so the variants read as siblings.
const LETTER_M = ["X...X", "XX.XX", "X.X.X", "X...X", "X...X", "X...X", "X...X"];
const LETTER_S = [".XXX.", "X....", "X....", ".XXX.", "....X", "....X", "XXXX."];

const LETTER_COLS = 5;
const LETTER_ROWS = 7;
const LETTER_GAP_COLS = 1; // lattice cols between M and S: 5 + 1 + 5 = 11

export type Cell = { col: number; row: number };

function letterCells(letter: readonly string[], colOffset: number, rowOffset: number): Cell[] {
  const cells: Cell[] = [];
  letter.forEach((line, row) => {
    line.split("").forEach((char, col) => {
      if (char !== "X") return;
      cells.push({ col: col + colOffset, row: row + rowOffset });
    });
  });
  return cells;
}

const ROW_OFFSET = Math.round((LATTICE_SIZE - LETTER_ROWS) / 2); // 2

export const GLYPH_CELLS: readonly Cell[] = [
  ...letterCells(LETTER_M, 0, ROW_OFFSET),
  ...letterCells(LETTER_S, LETTER_COLS + LETTER_GAP_COLS, ROW_OFFSET),
];

const glyphKeys = new Set(GLYPH_CELLS.map((cell) => `${cell.col},${cell.row}`));

// Every lattice cell the glyph does not occupy: the pool scramble frames
// draw noise pixels from.
export const NOISE_CELLS: readonly Cell[] = (() => {
  const cells: Cell[] = [];
  for (let row = 0; row < LATTICE_SIZE; row++) {
    for (let col = 0; col < LATTICE_SIZE; col++) {
      if (glyphKeys.has(`${col},${row}`)) continue;
      cells.push({ col, row });
    }
  }
  return cells;
})();

export function cellToPx(cell: Cell): { x: number; y: number } {
  return { x: ORIGIN + cell.col * PITCH, y: ORIGIN + cell.row * PITCH };
}
