import { removeSubscriber, isSubscribeConfigured } from "@/lib/subscribers-store";
import { verifyUnsubscribeToken } from "@/lib/mailer";

// One-click unsubscribe target. Links are signed per recipient (HMAC), so
// only someone holding a subscriber's own email can remove it.

function page(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="font-family:-apple-system,'Segoe UI',sans-serif;background:#09090b;color:#e4e4e7;margin:0">
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px;box-sizing:border-box">
<h1 style="font-size:20px;font-weight:500;margin:0 0 8px">${title}</h1>
<p style="color:#a1a1aa;margin:0 0 16px">${body}</p>
<a href="https://markstuart.dev" style="color:#2dd4bf">markstuart.dev</a>
</div>
</body>
</html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

async function handle(request: Request): Promise<Response> {
  if (!isSubscribeConfigured()) return page("Not available", "Try again later.", 503);
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const token = url.searchParams.get("token") ?? "";
  let valid = false;
  try {
    valid = Boolean(email) && Boolean(token) && verifyUnsubscribeToken(email, token);
  } catch {
    valid = false;
  }
  if (!valid) return page("Invalid link", "This unsubscribe link is not valid.", 400);
  await removeSubscriber(email);
  return page("You're unsubscribed", "No more emails. Resubscribe anytime from the writing page.");
}

export async function GET(request: Request) {
  return handle(request);
}

// RFC 8058 one-click unsubscribe (Gmail's native button POSTs here).
export async function POST(request: Request) {
  return handle(request);
}
