export function GET() {
  return Response.json(
    { status: "unavailable", reason: "not_available" },
    {
      status: 410,
      headers: { "Cache-Control": "private, no-store" },
    }
  );
}
