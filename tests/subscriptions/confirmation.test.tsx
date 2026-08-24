import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  confirmSubscriber: vi.fn(),
  getOrCreateUnsubscribeToken: vi.fn(),
  isConfirmationTokenValid: vi.fn(),
}));
const sendWelcomeEmail = vi.hoisted(() => vi.fn());
const processLifecycleMailJob = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() => vi.fn());
const afterCallbacks = vi.hoisted(() => [] as Array<() => Promise<void>>);
const after = vi.hoisted(() => vi.fn((callback: () => Promise<void>) => {
  afterCallbacks.push(callback);
}));

vi.mock("@/lib/subscribers-store", () => store);
vi.mock("@/lib/mailer", () => ({ processLifecycleMailJob, sendWelcomeEmail }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/server", () => ({ after }));

import ConfirmationPage from "@/app/subscribe/confirm/page";
import { confirmSubscription } from "@/app/subscribe/confirm/actions";

beforeEach(() => {
  vi.clearAllMocks();
  store.isConfirmationTokenValid.mockResolvedValue(true);
  store.confirmSubscriber.mockResolvedValue({
    status: "confirmed",
    email: "reader@example.com",
    welcomeJobId: "welcome-job",
  });
  store.getOrCreateUnsubscribeToken.mockResolvedValue("unsubscribe-token");
  sendWelcomeEmail.mockResolvedValue(undefined);
  processLifecycleMailJob.mockResolvedValue(undefined);
  afterCallbacks.length = 0;
});

describe("confirmation page", () => {
  it("GET renders a deliberate POST form without consuming the token", async () => {
    render(
      await ConfirmationPage({
        searchParams: Promise.resolve({ token: "confirmation-token" }),
      }),
    );

    expect(screen.getByRole("button", { name: "Confirm subscription" })).toBeInTheDocument();
    expect(store.confirmSubscriber).not.toHaveBeenCalled();
  });

  it("the form action confirms once and defers its durable welcome job", async () => {
    const formData = new FormData();
    formData.set("token", "confirmation-token");

    await confirmSubscription(formData);

    expect(store.confirmSubscriber).toHaveBeenCalledTimes(1);
    expect(store.getOrCreateUnsubscribeToken).not.toHaveBeenCalled();
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
    expect(processLifecycleMailJob).not.toHaveBeenCalled();
    expect(afterCallbacks).toHaveLength(1);
    expect(redirect).toHaveBeenCalledWith("/subscribe/confirm?status=confirmed");

    await afterCallbacks[0]?.();
    expect(processLifecycleMailJob).toHaveBeenCalledWith("welcome", "welcome-job");
  });
});
