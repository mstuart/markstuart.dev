import { createElement } from "react";
import { Star } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AllReposFilter } from "@/components/all-repos-filter";
import { allRepos } from "@/lib/data/all-projects";
import { npmMaintained, projects } from "@/lib/data/projects";
import { formatStarCount } from "@/lib/format";
import { getProjectIcon } from "@/lib/project-icons";
import { pageMetadata } from "@/lib/metadata";
import type { Project } from "@/lib/types";

export const metadata = pageMetadata({
  title: "Projects",
  description: "Open source I'm building now, and the projects I helped make big.",
  path: "/projects",
});

function formatMonthYear(date?: string): string | null {
  if (!date || !/^\d{4}-\d{2}/.test(date)) return null;
  return new Date(`${date.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

const caseStudySlugs = new Map([
  ["peek", "peek"],
  ["tare", "tare"],
  ["graphql-agent-toolkit", "graphql-agent-toolkit"],
]);

function ProjectCard({ project }: { project: Project }) {
  const starCount = formatStarCount(project.stars);
  const monthYear = formatMonthYear(project.createdAt);
  const caseStudySlug = caseStudySlugs.get(project.name);
  return (
    <article className="relative border-b border-line md:rounded-lg md:border">
      <Link
        href={caseStudySlug ? `/projects/${caseStudySlug}` : project.url}
        aria-label={project.name}
        target={caseStudySlug ? undefined : "_blank"}
        rel={caseStudySlug ? undefined : "noopener noreferrer"}
        className="group flex gap-3 rounded-lg py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:p-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted">
          {createElement(getProjectIcon(project.icon), { size: 18, weight: "regular" })}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="break-words font-medium text-foreground transition-colors group-hover:text-accent">
              {project.name}
            </h3>
            <span className="flex shrink-0 items-center gap-3 font-mono text-xs tabular-nums text-muted">
              {monthYear ? <span>{monthYear}</span> : null}
              {starCount ? (
                <span className="inline-flex items-center gap-1">
                  <Star size={12} weight="regular" />
                  {starCount}
                </span>
              ) : null}
            </span>
          </div>
          <span className="mt-1.5 block text-sm leading-relaxed text-muted">{project.description}</span>
          <span className="mt-2 block text-xs text-muted">
            {project.role === "author" ? "Author" : "Core contributor"}
          </span>
        </div>
      </Link>
      {caseStudySlug ? (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${project.name} repository on GitHub`}
          className="absolute right-0 bottom-4 z-10 rounded-sm text-xs text-muted underline decoration-dotted underline-offset-4 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:right-5 md:bottom-5"
        >
          GitHub
        </a>
      ) : null}
    </article>
  );
}

const byCreatedDesc = <T extends { createdAt?: string }>(a: T, b: T) =>
  (a.createdAt ?? "") < (b.createdAt ?? "") ? 1 : -1;

export default function ProjectsPage() {
  const authored = projects.filter((project) => project.role === "author").sort(byCreatedDesc);
  const coreContributions = projects
    .filter((project) => project.role === "core contributor")
    .sort((a, b) => b.stars - a.stars);
  const allProjects = [...allRepos].sort(byCreatedDesc);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-2xl font-medium text-foreground">Projects</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Open source projects, plus core contributions from my time at PayPal.
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted">Featured</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 md:gap-4">
          {authored.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-medium text-muted">Core contributions</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 md:gap-4">
          {coreContributions.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="flex items-baseline gap-2 text-sm font-medium text-muted">
          All repositories
          <span className="font-mono text-xs font-normal tabular-nums text-muted">
            {allProjects.length}
          </span>
        </h2>
        <div className="mt-3">
          <AllReposFilter repos={allProjects} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted">
          Also on{" "}
          <a
            href="https://www.npmjs.com/~mstuart"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm underline decoration-dotted underline-offset-4 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            npm
          </a>
        </h2>
        <p className="mt-3 text-sm text-muted">{npmMaintained.join(", ")}</p>
      </section>
    </div>
  );
}
