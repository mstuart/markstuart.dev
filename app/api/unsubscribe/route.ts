import { logServerError } from "@/lib/server/log";
import {
  isSubscribeConfigured,
  isUnsubscribeTokenValid,
  unsubscribeSubscriber,
} from "@/lib/subscribers-store";

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function page(title: string, body: string, status = 200, token?: string): Response {
  const form = token
    ? `<form method="post" action="/api/unsubscribe">
<input type="hidden" name="token" value="${escapeAttribute(token)}">
<button type="submit">Confirm unsubscribe</button>
</form>`
    : "";
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
</head>
<body style="font-family:-apple-system,'Segoe UI',sans-serif;background:#09090b;color:#e4e4e7;margin:0">
<main style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px;box-sizing:border-box">
<h1 style="font-size:20px;font-weight:500;margin:0 0 8px">${title}</h1>
<p style="color:#a1a1aa;margin:0 0 16px">${body}</p>
${form}
<a href="https://markstuart.dev" style="color:#2dd4bf">markstuart.dev</a>
</main>
</body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}

export async function GET(request: Request): Promise<Response> {
  if (!isSubscribeConfigured()) return page("Not available", "Try again later.", 503);
  const token = new URL(request.url).searchParams.get("token") ?? "";
  try {
    if (!(await isUnsubscribeTokenValid(token))) {
      return page("Invalid link", "This unsubscribe link is not valid.", 400);
    }
    return page(
      "Unsubscribe?",
      "Confirm that you no longer want new-post emails.",
      200,
      token,
    );
  } catch (error) {
    logServerError({
      correlationId: crypto.randomUUID(),
      operation: "unsubscribe_get",
      provider: "redis",
      error,
    });
    return page("Not available", "Try again later.", 503);
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!isSubscribeConfigured()) return page("Not available", "Try again later.", 503);
  const url = new URL(request.url);
  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await request.text());
  } catch {
    return page("Invalid request", "This unsubscribe request is not valid.", 400);
  }

  const oneClick = form.get("List-Unsubscribe") === "One-Click";
  const token = oneClick ? (url.searchParams.get("token") ?? "") : (form.get("token") ?? "");
  try {
    if (!(await isUnsubscribeTokenValid(token))) {
      return oneClick
        ? new Response(null, { status: 400, headers: { "X-Robots-Tag": "noindex" } })
        : page("Invalid link", "This unsubscribe link is not valid.", 400);
    }
    const result = await unsubscribeSubscriber(token);
    if (result.status !== "unsubscribed") {
      return oneClick
        ? new Response(null, { status: 400, headers: { "X-Robots-Tag": "noindex" } })
        : page("Invalid link", "This unsubscribe link is not valid.", 400);
    }
    if (oneClick) {
      return new Response(null, { status: 200, headers: { "X-Robots-Tag": "noindex" } });
    }
    return page(
      "You're unsubscribed",
      "No more emails. Resubscribe anytime from the writing page.",
    );
  } catch (error) {
    logServerError({
      correlationId: crypto.randomUUID(),
      operation: "unsubscribe_post",
      provider: "redis",
      error,
    });
    return oneClick
      ? new Response(null, { status: 503, headers: { "X-Robots-Tag": "noindex" } })
      : page("Not available", "Try again later.", 503);
  }
}
