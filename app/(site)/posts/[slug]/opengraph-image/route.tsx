import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { getPost } from "@/lib/posts";

const size = {
  width: 1200,
  height: 630,
};

const avatarData = await readFile(join(process.cwd(), "public", "avatar.png"), "base64");
const avatarSrc = `data:image/png;base64,${avatarData}`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 76px",
          background:
            "linear-gradient(135deg, #07111f 0%, #09090b 52%, #0d2b28 100%)",
          color: "#fafafa",
          fontFamily: "system-ui, -apple-system, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            color: "#5eead4",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.12em",
          }}
        >
          <div
            style={{
              width: 44,
              height: 5,
              borderRadius: 999,
              background: "#2dd4bf",
            }}
          />
          {(post.series ?? "The Web We Inherited").toUpperCase()}
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 1040,
            fontSize: 72,
            fontWeight: 650,
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
          }}
        >
          {post.title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <img
            src={avatarSrc}
            width={76}
            height={76}
            alt=""
            style={{
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.22)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", fontSize: 28, fontWeight: 650 }}>Mark Stuart</div>
            <div style={{ display: "flex", fontSize: 22, color: "#a1a1aa" }}>
              markstuart.dev
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
