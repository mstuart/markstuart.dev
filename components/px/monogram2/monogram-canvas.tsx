"use client";

import { useLayoutEffect, useRef } from "react";
import { GLYPH_CELLS, NOISE_CELLS, PIXEL_SIZE, TILE_SIZE, cellToPx, type Cell } from "./glyph-map";

// Zinc glyph tone, matched to the dot-matrix monogram's pixel color so the
// two variants read as siblings. Noise renders at a low fraction of the
// same tone so scramble frames stay legible as texture, not clutter.
const GLYPH_LIGHT = "82, 82, 91"; // zinc-600
const GLYPH_DARK = "212, 212, 216"; // zinc-300
const NOISE_ALPHA = 0.4;

const ENTRANCE_FRAMES = 7;
const ENTRANCE_FRAME_MS = 100; // ~700ms total
const ENTRANCE_NOISE_START = 18;

const HOVER_FRAMES = 4;
const HOVER_FRAME_MS = 100; // ~400ms total
const HOVER_NOISE_START = 10;

function isDarkTheme() {
  return document.documentElement.classList.contains("dark");
}

// Fisher-Yates using Math.random; only ever called from client-only draw
// code (canvas render, not JSX), so there is no hydration mismatch risk.
function shuffledIndices(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function sampleCells(pool: readonly Cell[], count: number): Cell[] {
  if (count <= 0) return [];
  if (count >= pool.length) return [...pool];
  const order = shuffledIndices(pool.length);
  return order.slice(0, count).map((i) => pool[i]);
}

type FrameState = { locked: Cell[]; noise: Cell[] };

function finalFrame(): FrameState {
  return { locked: [...GLYPH_CELLS], noise: [] };
}

export function MonogramDecodeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const replayTarget = canvas.closest<HTMLElement>("a, button, [tabindex]") ?? canvas;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(TILE_SIZE * dpr);
    canvas.height = Math.round(TILE_SIZE * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    let isDark = isDarkTheme();
    let current: FrameState = finalFrame();

    // Sequence state (entrance on mount, or a hover retrigger). No React
    // state is touched per frame; everything below lives in refs/closures
    // and only ever writes to the canvas.
    let timerId: ReturnType<typeof setInterval> | null = null;
    let sequenceActive = false;
    let sequenceFrame = 0;
    let sequenceTotal = 0;
    let sequenceFrameMs = ENTRANCE_FRAME_MS;
    let sequenceNoiseStart = 0;
    let sequenceOrder: number[] = [];

    function draw(state: FrameState) {
      if (!ctx) return;
      ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
      const rgb = isDark ? GLYPH_DARK : GLYPH_LIGHT;
      ctx.fillStyle = `rgb(${rgb})`;
      for (const cell of state.locked) {
        const { x, y } = cellToPx(cell);
        ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
      }
      ctx.fillStyle = `rgba(${rgb}, ${NOISE_ALPHA})`;
      for (const cell of state.noise) {
        const { x, y } = cellToPx(cell);
        ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
      }
    }

    function renderSequenceFrame() {
      const lockedCount = Math.round(((sequenceFrame + 1) / sequenceTotal) * GLYPH_CELLS.length);
      const noiseCount = Math.round(sequenceNoiseStart * (1 - (sequenceFrame + 1) / sequenceTotal));
      const locked = sequenceOrder.slice(0, lockedCount).map((i) => GLYPH_CELLS[i]);
      const noise = sampleCells(NOISE_CELLS, noiseCount);
      current = { locked, noise };
      draw(current);
    }

    function stopTimer() {
      if (timerId === null) return;
      clearInterval(timerId);
      timerId = null;
    }

    function tick() {
      sequenceFrame += 1;
      if (sequenceFrame >= sequenceTotal) {
        current = finalFrame();
        draw(current);
        stopTimer();
        sequenceActive = false;
        return;
      }
      renderSequenceFrame();
    }

    function startSequence(totalFrames: number, frameMs: number, noiseStart: number) {
      stopTimer();
      sequenceTotal = totalFrames;
      sequenceFrameMs = frameMs;
      sequenceNoiseStart = noiseStart;
      sequenceOrder = shuffledIndices(GLYPH_CELLS.length);
      sequenceFrame = 0;
      sequenceActive = true;
      renderSequenceFrame();
      if (!document.hidden) {
        timerId = setInterval(tick, frameMs);
      }
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function handleReducedMotionChange() {
      if (!reducedMotionQuery.matches) return;
      stopTimer();
      sequenceActive = false;
      current = finalFrame();
      draw(current);
    }

    function handleVisibility() {
      if (document.hidden) {
        stopTimer();
        return;
      }
      if (sequenceActive && timerId === null) {
        timerId = setInterval(tick, sequenceFrameMs);
      }
    }

    function handleReplay() {
      if (reducedMotionQuery.matches) return;
      startSequence(HOVER_FRAMES, HOVER_FRAME_MS, HOVER_NOISE_START);
    }

    const themeObserver = new MutationObserver(() => {
      const nowDark = isDarkTheme();
      if (nowDark !== isDark) {
        isDark = nowDark;
        draw(current);
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    if (reducedMotionQuery.matches) {
      current = finalFrame();
      draw(current);
    } else {
      startSequence(ENTRANCE_FRAMES, ENTRANCE_FRAME_MS, ENTRANCE_NOISE_START);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    canvas.addEventListener("mouseenter", handleReplay);
    replayTarget.addEventListener("focus", handleReplay);

    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
      canvas.removeEventListener("mouseenter", handleReplay);
      replayTarget.removeEventListener("focus", handleReplay);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={TILE_SIZE}
      height={TILE_SIZE}
      style={{ width: TILE_SIZE, height: TILE_SIZE, imageRendering: "pixelated" }}
    />
  );
}
