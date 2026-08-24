"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";

import { processLifecycleMailJob } from "@/lib/mailer";
import { logServerError } from "@/lib/server/log";
import { confirmSubscriber } from "@/lib/subscribers-store";

export async function confirmSubscription(formData: FormData): Promise<void> {
  const tokenValue = formData.get("token");
  const token = typeof tokenValue === "string" ? tokenValue : "";
  const result = await confirmSubscriber(token);
  if (result.status !== "confirmed") {
    redirect("/subscribe/confirm?status=invalid");
    return;
  }

  after(async () => {
    try {
      await processLifecycleMailJob("welcome", result.welcomeJobId);
    } catch (error) {
      logServerError({
        correlationId: crypto.randomUUID(),
        operation: "subscription_welcome",
        error,
      });
    }
  });
  redirect("/subscribe/confirm?status=confirmed");
}
