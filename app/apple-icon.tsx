import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#18181b",
          color: "#2dd4bf",
          display: "flex",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 118,
          fontWeight: 600,
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        M
      </div>
    ),
    size
  );
}
