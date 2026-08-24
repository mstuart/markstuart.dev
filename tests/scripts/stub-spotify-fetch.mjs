const refreshToken = "test-refresh-token-sentinel";

globalThis.fetch = async (_input, init) => {
  const body = new URLSearchParams(init?.body);

  if (body.get("code") === "stall") {
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () => reject(init.signal.reason ?? new Error("aborted")),
        { once: true }
      );
    });
  }

  if (body.get("code") === "provider-error") {
    return Response.json(
      { error: "sensitive-provider-detail-sentinel" },
      { status: 400 }
    );
  }

  return Response.json({ refresh_token: refreshToken });
};
