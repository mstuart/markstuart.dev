"use client";

import { useLayoutEffect, useRef } from "react";

// Same decode-loop grammar as the header monogram (monogram2), applied to
// the profile photo: cells lock in from a pixelated mosaic to the full-res
// image once. It replays periodically and after direct interaction.
const TILE_SIZE = 200;
const GRID = 14;
const CELL = TILE_SIZE / GRID;

const ENTRANCE_FRAMES = 7;
const ENTRANCE_FRAME_MS = 100; // ~700ms total

const HOVER_FRAMES = 4;
const HOVER_FRAME_MS = 100; // ~400ms total
const AMBIENT_REPLAY_MS = 5000;

function shuffledIndices(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function AvatarDecodeCanvas({ src }: { src: string }) {
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

    const image = new Image();
    image.src = src;
    image.decoding = "async";

    // Per-cell average colors for the mosaic, sampled once after load by
    // shrinking the photo onto a GRID x GRID offscreen canvas.
    let blockColors: string[] = [];
    let imageReady = false;

    let lockedCount = GRID * GRID;
    let cellOrder: number[] = [];

    let timerId: ReturnType<typeof setInterval> | null = null;
    let ambientTimerId: ReturnType<typeof setTimeout> | null = null;
    let sequenceActive = false;
    let sequenceFrame = 0;
    let sequenceTotal = 0;
    let sequenceFrameMs = ENTRANCE_FRAME_MS;

    function draw() {
      if (!ctx || !imageReady) return;
      ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(image, 0, 0, TILE_SIZE, TILE_SIZE);
      if (lockedCount >= GRID * GRID) return;
      const unlocked = cellOrder.slice(lockedCount);
      for (const index of unlocked) {
        const cx = index % GRID;
        const cy = Math.floor(index / GRID);
        ctx.fillStyle = blockColors[index] ?? "rgb(161, 161, 170)";
        ctx.fillRect(cx * CELL, cy * CELL, CELL, CELL);
      }
    }

    function renderSequenceFrame() {
      lockedCount = Math.round(((sequenceFrame + 1) / sequenceTotal) * GRID * GRID);
      draw();
    }

    function stopTimer() {
      if (timerId === null) return;
      clearInterval(timerId);
      timerId = null;
    }

    function stopAmbientTimer() {
      if (ambientTimerId === null) return;
      clearTimeout(ambientTimerId);
      ambientTimerId = null;
    }

    function scheduleAmbientReplay() {
      stopAmbientTimer();
      if (reducedMotionQuery.matches || document.hidden || !imageReady || sequenceActive) return;
      ambientTimerId = setTimeout(() => {
        ambientTimerId = null;
        startSequence(HOVER_FRAMES, HOVER_FRAME_MS);
      }, AMBIENT_REPLAY_MS);
    }

    function tick() {
      sequenceFrame += 1;
      if (sequenceFrame >= sequenceTotal) {
        lockedCount = GRID * GRID;
        draw();
        stopTimer();
        sequenceActive = false;
        scheduleAmbientReplay();
        return;
      }
      renderSequenceFrame();
    }

    function startSequence(totalFrames: number, frameMs: number) {
      stopTimer();
      stopAmbientTimer();
      sequenceTotal = totalFrames;
      sequenceFrameMs = frameMs;
      cellOrder = shuffledIndices(GRID * GRID);
      sequenceFrame = 0;
      sequenceActive = true;
      renderSequenceFrame();
      if (!document.hidden) {
        timerId = setInterval(tick, frameMs);
      }
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function handleReducedMotionChange() {
      if (reducedMotionQuery.matches) {
        stopTimer();
        stopAmbientTimer();
        sequenceActive = false;
        lockedCount = GRID * GRID;
        draw();
      } else {
        scheduleAmbientReplay();
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        stopTimer();
        stopAmbientTimer();
        return;
      }
      if (sequenceActive && timerId === null) {
        timerId = setInterval(tick, sequenceFrameMs);
      } else {
        scheduleAmbientReplay();
      }
    }

    function handleReplay() {
      if (reducedMotionQuery.matches) return;
      startSequence(HOVER_FRAMES, HOVER_FRAME_MS);
    }

    image.onload = () => {
      const sampler = document.createElement("canvas");
      sampler.width = GRID;
      sampler.height = GRID;
      const sctx = sampler.getContext("2d");
      if (!sctx) return;
      sctx.drawImage(image, 0, 0, GRID, GRID);
      const data = sctx.getImageData(0, 0, GRID, GRID).data;
      blockColors = Array.from({ length: GRID * GRID }, (_, i) => {
        const o = i * 4;
        return `rgb(${data[o]}, ${data[o + 1]}, ${data[o + 2]})`;
      });
      imageReady = true;
      if (reducedMotionQuery.matches) {
        lockedCount = GRID * GRID;
        draw();
      } else {
        startSequence(ENTRANCE_FRAMES, ENTRANCE_FRAME_MS);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    canvas.addEventListener("mouseenter", handleReplay);
    replayTarget.addEventListener("focus", handleReplay);

    return () => {
      stopTimer();
      stopAmbientTimer();
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
      canvas.removeEventListener("mouseenter", handleReplay);
      replayTarget.removeEventListener("focus", handleReplay);
      image.onload = null;
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      width={TILE_SIZE}
      height={TILE_SIZE}
      style={{ width: TILE_SIZE, height: TILE_SIZE }}
    />
  );
}
