import type { Metadata } from "next";
import { ArrowUpRight, Star } from "@phosphor-icons/react/dist/ssr";
import { AllReposFilter } from "@/components/all-repos-filter";
import { allRepos } from "@/lib/data/all-projects";
import { npmMaintained, projects } from "@/lib/data/projects";
import { formatStarCount } from "@/lib/format";
import { getProjectIcon } from "@/lib/project-icons";
import type { Project } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projects",
  description: "Open source I'm building now, and the projects I helped make big.",
};

// Muted cover-tile palette, hashed per project name so every card gets a
// stable color. Tuned to sit with the zinc/teal system in both themes.
const TILE_COLORS = ["#0f766e", "#1e40af", "#6d28d9", "#b45309", "#9d174d", "#065f46"];

function tileColor(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100003;
  }
  return TILE_COLORS[hash % TILE_COLORS.length];
}

function formatMonthYear(date?: string): string | null {
  if (!date || !/^\d{4}-\d{2}/.test(date)) return null;
  return new Date(`${date.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function ProjectCard({ project }: { project: Project }) {
  const Icon = getProjectIcon(project.icon);
  const starCount = formatStarCount(project.stars);
  const monthYear = formatMonthYear(project.createdAt);
  return (
    <article>
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400"
      >
        <div
          className="flex aspect-[5/3] items-center justify-center rounded-lg transition-opacity group-hover:opacity-90"
          style={{ backgroundColor: tileColor(project.name) }}
        >
          <Icon size={40} weight="regular" className="text-white/90" />
        </div>
        <h3 className="mt-3 flex items-center justify-between gap-2 text-zinc-900 transition-colors group-hover:text-teal-600 dark:text-zinc-100 dark:group-hover:text-teal-400">
          <span className="truncate font-medium">{project.name}</span>
          {starCount ? (
            <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-zinc-400 dark:text-zinc-500">
              <Star size={12} weight="regular" />
              {starCount}
            </span>
          ) : null}
        </h3>
        {monthYear ? (
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">{monthYear}</p>
        ) : null}
        <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {project.description}
        </p>
      </a>
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
  const featuredNames = new Set(projects.map((project) => project.name));
  const remainingRepos = allRepos
    .filter((repo) => !featuredNames.has(repo.name))
    .sort(byCreatedDesc);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-medium text-zinc-900 dark:text-zinc-100">Projects</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Open source projects, plus core contributions from my time at PayPal.
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Featured</h2>
        <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3">
          {authored.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Core contributions</h2>
        <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3">
          {coreContributions.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="flex items-baseline gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          All repositories
          <span className="font-mono text-xs font-normal tabular-nums text-zinc-400 dark:text-zinc-500">
            {remainingRepos.length + authored.length}
          </span>
        </h2>
        <div className="mt-3">
          <AllReposFilter repos={remainingRepos} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Also on{" "}
          <a
            href="https://www.npmjs.com/~mstuart"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm underline decoration-dotted underline-offset-4 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
          >
            npm
          </a>
        </h2>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{npmMaintained.join(", ")}</p>
      </section>
    </div>
  );
}
