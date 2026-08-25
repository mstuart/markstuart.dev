"use client";

import { useState } from "react";
import Image from "next/image";
import { Printer } from "@phosphor-icons/react";
import {
  awards,
  focusAreas,
  industryContributions,
  resumeRoles,
  resumeSummary,
} from "@/lib/data/resume";

function formatMonth(value: string): string {
  if (value === "Present") return "Present";
  return new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

const COMPANY_LOGOS: Record<string, string> = {
  Rocket: "/work/rocket.png",
  eBay: "/work/ebay.png",
  PayPal: "/work/paypal.png",
  "Qplay, Inc.": "/work/qplay.png",
  "State Farm Insurance": "/work/statefarm.png",
};

export function CompanyTile({ company }: { company: string }) {
  const src = COMPANY_LOGOS[company];
  return (
    <span
      aria-hidden="true"
      data-print-hide
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted ring-1 ring-line/20"
    >
      {src ? (
        <Image src={src} alt="" width={32} height={32} className="h-full w-full object-contain" />
      ) : (
        <span className="font-serif text-sm text-muted">{company.charAt(0)}</span>
      )}
    </span>
  );
}

function pillClass(active: boolean) {
  return [
    "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
    active
      ? "border-accent text-accent"
      : "border-line text-muted hover:border-control-border hover:text-foreground",
  ].join(" ");
}

export function ResumeView() {
  const [view, setView] = useState<"short" | "long">("short");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3" data-print-hide>
        <div className="flex gap-2">
          <button type="button" aria-pressed={view === "short"} onClick={() => setView("short")} className={pillClass(view === "short")}>
            Short
          </button>
          <button type="button" aria-pressed={view === "long"} onClick={() => setView("long")} className={pillClass(view === "long")}>
            Long
          </button>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm text-muted transition-colors hover:border-control-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
        >
          <Printer size={14} weight="regular" />
          Print
        </button>
      </div>

      <p className="mt-8 leading-relaxed text-zinc-600 dark:text-zinc-400">{resumeSummary}</p>

      {view === "long" ? (
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          {focusAreas.map((area) => (
            <span key={area}>{area}</span>
          ))}
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted">Experience</h2>
        <div className="mt-4 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {resumeRoles.map((role) => (
            <div key={`${role.company}-${role.title}`} className="flex gap-3 py-4">
              <CompanyTile company={role.company} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <p className="min-w-0 text-zinc-900 dark:text-zinc-100">
                    <span className="font-medium">{role.title}</span>
                    <span className="text-muted"> at {role.company}</span>
                  </p>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                    {formatMonth(role.start)} to {formatMonth(role.end)}
                  </span>
                </div>
                {view === "short" ? (
                  <p className="mt-1 text-sm text-muted">{role.short}</p>
                ) : (
                  <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-sm leading-relaxed text-muted marker:text-zinc-300 dark:marker:text-zinc-700">
                    {role.bullets.map((bullet) => (
                      <li key={bullet.slice(0, 40)}>{bullet}</li>
                    ))}
                  </ul>
                )}
                {role.evidence ? (
                  <ul
                    aria-label={`Public evidence for ${role.title} at ${role.company}`}
                    className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs"
                  >
                    {role.evidence.map((item) => (
                      <li key={item.url}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-sm text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {view === "long" ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-muted">Industry contributions</h2>
          <ul className="mt-4 flex list-disc flex-col gap-1.5 pl-4 text-sm leading-relaxed text-muted marker:text-zinc-300 dark:marker:text-zinc-700">
            {industryContributions.map((item) => (
              <li key={item.slice(0, 40)}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted">Awards</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{awards.join(" · ")}</p>
      </section>

    </div>
  );
}
