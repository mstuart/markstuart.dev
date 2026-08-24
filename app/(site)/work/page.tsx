import { ResumeView } from "@/components/resume-view";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Work",
  description: "The career: nearly two decades across PayPal, eBay, and Rocket, in short and long form.",
  path: "/work",
});

export default function WorkPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16" data-resume-page>
      <h1 className="text-2xl font-medium text-zinc-900 dark:text-zinc-100">Work</h1>
      <p className="mt-2 text-sm text-muted" data-print-hide>
        Toggle the long version for the full story, or print either one.
      </p>
      <div className="mt-8">
        <ResumeView />
      </div>
    </div>
  );
}
