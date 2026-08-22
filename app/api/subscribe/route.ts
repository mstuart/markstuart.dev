import { addSubscriber, isSubscribeConfigured, isValidEmail } from "@/lib/subscribers-store";

export async function POST(request: Request) {
  if (!isSubscribeConfigured()) {
    return Response.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  let email: string | null = null;
  try {
    const body = (await request.json()) as { email?: string };
    email = body.email ?? null;
  } catch {
    email = null;
  }
  if (!email || !isValidEmail(email)) {
    return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  try {
    const added = await addSubscriber(email);
    return Response.json({ ok: true, added });
  } catch {
    return Response.json({ ok: false, error: "store_failed" }, { status: 500 });
  }
}
