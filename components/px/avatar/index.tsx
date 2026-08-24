import { AvatarDecodeCanvas } from "./avatar-canvas";

export function PixelAvatar() {
  return (
    <div className="relative flex h-63 w-63 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
      <span className="sr-only">Portrait of Mark Stuart</span>
      <div aria-hidden="true">
        <AvatarDecodeCanvas src="/avatar.png" />
      </div>
    </div>
  );
}
