// @vitest-environment node

import { describe, expect, it } from "vitest";
import AppleIcon from "@/app/apple-icon";

describe("Apple touch icon response", () => {
  it("renders a 180px PNG response", async () => {
    const response = AppleIcon();
    const png = new Uint8Array(await response.arrayBuffer());
    const header = new DataView(png.buffer, png.byteOffset, png.byteLength);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(Array.from(png.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(header.getUint32(16)).toBe(180);
    expect(header.getUint32(20)).toBe(180);
  });
});
