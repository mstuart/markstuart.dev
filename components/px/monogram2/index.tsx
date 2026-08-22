import { MonogramDecodeCanvas } from "./monogram-canvas";

export function PixelMonogram2() {
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
      <span className="sr-only">MS</span>
      <div aria-hidden="true">
        <MonogramDecodeCanvas />
      </div>
    </div>
  );
}
