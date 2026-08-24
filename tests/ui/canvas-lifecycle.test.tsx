import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AvatarDecodeCanvas } from "@/components/px/avatar/avatar-canvas";
import { MonogramDecodeCanvas } from "@/components/px/monogram2/monogram-canvas";

type CanvasKind = "avatar" | "monogram";

type FakeImage = {
  decoding: string;
  onload: null | (() => void);
  src: string;
};

let fakeImages: FakeImage[] = [];
let reducedMotion = false;

const mediaListeners = new Set<EventListener>();
const canvasContext = {
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: "",
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(14 * 14 * 4) })),
  imageSmoothingEnabled: false,
  setTransform: vi.fn(),
};

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, value: hidden });
}

function renderCanvas(kind: CanvasKind) {
  const result = render(
    <button type="button">
      {kind === "avatar" ? <AvatarDecodeCanvas src="/avatar.jpg" /> : <MonogramDecodeCanvas />}
    </button>,
  );
  const canvas = result.container.querySelector("canvas");
  const button = result.getByRole("button");
  if (!canvas) throw new Error("canvas did not render");

  if (kind === "avatar") {
    act(() => fakeImages[0]?.onload?.());
  }

  return { ...result, button, canvas };
}

beforeEach(() => {
  vi.useFakeTimers();
  setHidden(false);
  reducedMotion = false;
  fakeImages = [];
  mediaListeners.clear();
  vi.clearAllMocks();

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => canvasContext as unknown as CanvasRenderingContext2D,
  );
  vi.stubGlobal(
    "Image",
    class {
      decoding = "";
      onload: null | (() => void) = null;
      src = "";

      constructor() {
        fakeImages.push(this);
      }
    },
  );
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: reducedMotion,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: (_type: string, listener: EventListener) => mediaListeners.add(listener),
      removeEventListener: (_type: string, listener: EventListener) => mediaListeners.delete(listener),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia,
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  setHidden(false);
});

describe.each<CanvasKind>(["avatar", "monogram"])("%s decode canvas", (kind) => {
  it("autoplays one bounded entrance without scheduling an ambient replay", () => {
    renderCanvas(kind);

    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(700));
    expect(vi.getTimerCount()).toBe(0);

    act(() => vi.advanceTimersByTime(10_000));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("pauses an active entrance while hidden and resumes it when visible", () => {
    renderCanvas(kind);

    setHidden(true);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(vi.getTimerCount()).toBe(0);

    setHidden(false);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(vi.getTimerCount()).toBe(1);

    act(() => vi.advanceTimersByTime(700));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("replays only after direct hover or focus interaction", () => {
    const { button, canvas } = renderCanvas(kind);
    act(() => vi.advanceTimersByTime(700));

    fireEvent.mouseEnter(canvas);
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(400));
    expect(vi.getTimerCount()).toBe(0);

    fireEvent.focus(button);
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(400));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not autoplay or replay when reduced motion is requested", () => {
    reducedMotion = true;
    const { button, canvas } = renderCanvas(kind);

    expect(vi.getTimerCount()).toBe(0);
    fireEvent.mouseEnter(canvas);
    fireEvent.focus(button);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("removes timers and replay listeners on unmount", () => {
    const { button, canvas, unmount } = renderCanvas(kind);

    unmount();
    expect(vi.getTimerCount()).toBe(0);

    fireEvent.mouseEnter(canvas);
    fireEvent.focus(button);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(vi.getTimerCount()).toBe(0);
    expect(mediaListeners).toHaveLength(0);
  });
});
