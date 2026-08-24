import Link from "next/link";
import {
  awards,
  focusAreas,
  industryContributions,
  resumeRoles,
  resumeSummary,
} from "@/lib/data/resume";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Full resume",
  description: "Mark Stuart's complete career history, focus areas, industry contributions, and awards.",
  path: "/work/full",
});

function formatMonth(value: string): string {
  if (value === "Present") return "Present";
  return new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default function FullResumePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16" data-resume-page>
      <Link
        href="/work"
        className="rounded-md text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Short resume
      </Link>

      <h1 className="mt-8 text-2xl font-medium text-zinc-900 dark:text-zinc-100">Full resume</h1>
      <p className="mt-6 leading-relaxed text-zinc-600 dark:text-zinc-400">{resumeSummary}</p>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted">Focus areas</h2>
        <ul className="mt-4 flex flex-col gap-1.5 text-sm leading-relaxed text-muted">
          {focusAreas.map((area) => (
            <li key={area}>{area}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted">Experience</h2>
        <div className="mt-4 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {resumeRoles.map((role) => (
            <article key={`${role.company}-${role.title}`} className="py-5">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <h3 className="text-zinc-900 dark:text-zinc-100">
                  <span className="font-medium">{role.title}</span>
                  <span className="text-muted"> at {role.company}</span>
                </h3>
                <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
                  {formatMonth(role.start)} to {formatMonth(role.end)}
                </p>
              </div>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-4 text-sm leading-relaxed text-muted marker:text-zinc-300 dark:marker:text-zinc-700">
                {role.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted">
          Industry contributions
        </h2>
        <ul className="mt-4 flex list-disc flex-col gap-1.5 pl-4 text-sm leading-relaxed text-muted marker:text-zinc-300 dark:marker:text-zinc-700">
          {industryContributions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted">Awards</h2>
        <ul className="mt-4 flex flex-col gap-1.5 text-sm leading-relaxed text-muted">
          {awards.map((award) => (
            <li key={award}>{award}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
