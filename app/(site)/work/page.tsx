import type { Metadata } from "next";
import { ResumeView } from "@/components/resume-view";

export const metadata: Metadata = {
  title: "Work",
};

export default function WorkPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16" data-resume-page>
      <h1 className="text-2xl font-medium text-zinc-900 dark:text-zinc-100">Work</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400" data-print-hide>
        Fifteen-plus years across PayPal, eBay, and Rocket. Toggle the long version for the full
        story, or print either one.
      </p>
      <div className="mt-8">
        <ResumeView />
      </div>
    </div>
  );
}
