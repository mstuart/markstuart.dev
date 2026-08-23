import { ImageResponse } from "next/og";

export const alt = "Mark Stuart — Distinguished Engineer";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#09090b",
          fontFamily: "system-ui, -apple-system, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 40,
            height: 6,
            borderRadius: 3,
            background: "#14b8a6",
            marginBottom: 40,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 600,
            color: "#fafafa",
            letterSpacing: "-0.02em",
          }}
        >
          Mark Stuart
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 32,
            color: "#a1a1aa",
          }}
        >
          Distinguished Engineer
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 12,
            fontSize: 28,
            color: "#a1a1aa",
          }}
        >
          markstuart.dev
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
