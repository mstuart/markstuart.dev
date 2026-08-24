import { confirmSubscription } from "@/app/subscribe/confirm/actions";
import { isConfirmationTokenValid } from "@/lib/subscribers-store";

type ConfirmationPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    token?: string | string[];
  }>;
};

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const query = await searchParams;
  const status = typeof query.status === "string" ? query.status : "";
  const token = typeof query.token === "string" ? query.token : "";

  if (status === "confirmed") {
    return (
      <main className="mx-auto max-w-xl px-6 py-24">
        <h1 className="text-2xl font-semibold">Subscription confirmed</h1>
        <p className="mt-3 text-muted">You will receive an email when a new post is published.</p>
      </main>
    );
  }

  const valid = Boolean(token) && (await isConfirmationTokenValid(token));
  if (!valid || status === "invalid") {
    return (
      <main className="mx-auto max-w-xl px-6 py-24">
        <h1 className="text-2xl font-semibold">Invalid confirmation link</h1>
        <p className="mt-3 text-muted">This link is invalid or has expired.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="text-2xl font-semibold">Confirm your subscription</h1>
      <p className="mt-3 text-muted">One more step confirms that this address belongs to you.</p>
      <form action={confirmSubscription} className="mt-6">
        <input name="token" type="hidden" value={token} />
        <button
          className="rounded-md bg-control px-4 py-2 font-medium text-control-foreground hover:bg-accent-hover"
          type="submit"
        >
          Confirm subscription
        </button>
      </form>
    </main>
  );
}
