type ServerErrorContext = {
  correlationId: string;
  operation: string;
  provider?: "redis" | "resend" | "spotify" | "svix";
  error: unknown;
};

function errorClass(error: unknown): string {
  try {
    if (error instanceof TypeError) {
      return "TypeError";
    }
    if (error instanceof RangeError) {
      return "RangeError";
    }
    if (error instanceof SyntaxError) {
      return "SyntaxError";
    }
    if (error instanceof Error) {
      return "Error";
    }
  } catch {
    return "UnknownError";
  }
  return "UnknownError";
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  try {
    const status = Reflect.get(error, "status");
    return typeof status === "number" ? status : undefined;
  } catch {
    return undefined;
  }
}

export function logServerError(context: ServerErrorContext): void {
  try {
    console.error("server_error", {
      correlationId: context.correlationId,
      operation: context.operation,
      provider: context.provider,
      errorClass: errorClass(context.error),
      status: errorStatus(context.error),
    });
  } catch {
    // Logging must never replace the original application error.
  }
}
