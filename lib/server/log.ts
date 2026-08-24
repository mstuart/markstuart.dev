type ServerErrorCode =
  | "notification_delivery_failed"
  | "notification_lifecycle_delivery_failed"
  | "notification_recipient_delivery_failed"
  | "notification_run_failed";

type ServerErrorCounters = Partial<{
  lifecycleCompleted: number;
  lifecycleFailed: number;
  recipientSent: number;
  recipientFailed: number;
  postsAnnounced: number;
}>;

type ServerErrorContext = {
  correlationId: string;
  operation: string;
  provider?: "redis" | "resend" | "spotify" | "svix";
  code?: ServerErrorCode;
  counters?: ServerErrorCounters;
  error: unknown;
};

const COUNTER_NAMES = [
  "lifecycleCompleted",
  "lifecycleFailed",
  "recipientSent",
  "recipientFailed",
  "postsAnnounced",
] as const satisfies readonly (keyof ServerErrorCounters)[];

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

function safeCounters(counters: ServerErrorCounters | undefined): ServerErrorCounters | undefined {
  if (!counters) return undefined;

  const safe: ServerErrorCounters = {};
  for (const name of COUNTER_NAMES) {
    const value = counters[name];
    if (typeof value === "number" && Number.isFinite(value)) safe[name] = value;
  }
  return Object.keys(safe).length > 0 ? safe : undefined;
}

export function logServerError(context: ServerErrorContext): void {
  try {
    console.error("server_error", {
      correlationId: context.correlationId,
      operation: context.operation,
      provider: context.provider,
      code: context.code,
      counters: safeCounters(context.counters),
      errorClass: errorClass(context.error),
      status: errorStatus(context.error),
    });
  } catch {
    // Logging must never replace the original application error.
  }
}
