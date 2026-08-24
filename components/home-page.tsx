import { createElement } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "@phosphor-icons/react/dist/ssr";
import { SocialLinks } from "@/components/shared/social-links";
import { SectionV1 } from "@/components/v1/section";
import styles from "@/components/v1/entrance.module.css";
import { PixelScene5 } from "@/components/px/scene5";
import { PixelAvatar } from "@/components/px/avatar";
import { formatStarCount } from "@/lib/format";
import { projects } from "@/lib/data/projects";
import { getProjectIcon } from "@/lib/project-icons";
import { work } from "@/lib/data/work";

const selectedIdeas = [
  {
    title: "Scaling GraphQL and Checkout at PayPal",
    href: "/posts/scaling-graphql-and-checkout-at-paypal",
  },
  {
    title: "Building Federated API Platforms",
    href: "/posts/building-federated-api-platforms",
  },
  {
    title: "Coding Agent Infrastructure",
    href: "/posts/coding-agent-infrastructure",
  },
];

const inlineLinkClass =
  "rounded-lg text-zinc-900 underline decoration-dotted underline-offset-4 transition-colors hover:text-teal-600 hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-100 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400";

const chipClass =
  "inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-2 py-0.5 text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function LogoChip({ name, src, href }: { name: string; src: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={chipClass}>
      <Image src={src} alt="" width={16} height={16} className="h-4 w-4 rounded-[3px] object-contain" />
      {name}
    </a>
  );
}

function ProjectChip({
  name,
  icon,
  href,
  description,
}: {
  name: string;
  icon?: string;
  href: string;
  description: string;
}) {
  const label = `${name}: ${description}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={chipClass} title={label} aria-label={label}>
      {createElement(getProjectIcon(icon), {
        size: 14,
        weight: "regular",
        className: "shrink-0 text-muted",
      })}
      {name}
    </a>
  );
}

export function HomePage() {
  // The homepage grid shows current authored work (the same curated Featured
  // set as /projects), not the star-ranked PayPal-era core contributions.
  const selectedProjects = projects
    .filter((project) => project.role === "author" && project.name !== "vitals")
    .sort((a, b) => ((a.createdAt ?? "") < (b.createdAt ?? "") ? 1 : -1))
    .slice(0, 5);
  return (
    <div className="relative">
      <PixelScene5 />
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <div className="space-y-20">
          <header className={`${styles.fadeUp} relative`}>
            <div className="flex items-center gap-2 min-[360px]:gap-4">
              <PixelAvatar />
              <div>
                <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                  Mark Stuart
                </h1>
              </div>
            </div>

            <div className="mt-8 space-y-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
              <p>
                Hey! I&apos;m Mark, a Distinguished Engineer at Rocket. For nearly two decades,
                I&apos;ve built APIs, SDKs, and Web platforms for flagship consumer products at PayPal,
                eBay, and Rocket.
              </p>
              <p>
                I build developer platforms that make complex systems composable—from PayPal Checkout
                and federated GraphQL to tools for AI coding agents. Most of what I build in the open
                lives on{" "}
                <a href="https://github.com/mstuart" target="_blank" rel="noopener noreferrer" className={inlineLinkClass}>
                  GitHub
                </a>
                .
              </p>
            </div>

            <div className="mt-6 space-y-2 text-sm text-muted">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span>Now at</span>
                <LogoChip name="Rocket" src="/work/rocket.png" href="https://www.rocketcompanies.com/" />
                <span>previously</span>
                <LogoChip name="eBay" src="/work/ebay.png" href="https://www.ebay.com/" />
                <LogoChip name="PayPal" src="/work/paypal.png" href="https://www.paypal.com/" />
                <LogoChip name="State Farm" src="/work/statefarm.png" href="https://www.statefarm.com/" />
              </p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span>Building</span>
                {selectedProjects.map((project) => (
                  <ProjectChip
                    key={project.name}
                    name={project.name}
                    icon={project.icon}
                    href={project.url}
                    description={project.description}
                  />
                ))}
              </p>
            </div>
          </header>

          <SectionV1 heading="Work" index={1}>
            <div className="space-y-6">
              {work.map((entry) => (
                <div key={`${entry.company}-${entry.role}`} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-zinc-900 dark:text-zinc-100">
                      <span className="font-medium">{entry.role}</span>
                      <span className="text-muted"> at {entry.company}</span>
                    </p>
                    {entry.summary ? (
                      <p className="mt-1 text-sm text-muted">{entry.summary}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-muted">{entry.period}</span>
                </div>
              ))}
            </div>
            <Link
              href="/work"
              className="group mt-6 inline-flex items-center gap-1 rounded-lg text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Full resume
              <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </SectionV1>

          <SectionV1 heading="Selected ideas" index={2}>
            <div className="flex flex-col">
              {selectedIdeas.map((idea) => (
                <Link
                  key={idea.href}
                  href={idea.href}
                  className="group flex items-baseline justify-between gap-4 rounded-lg px-2 py-3 -mx-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400"
                >
                  <span className="truncate text-zinc-600 transition-colors group-hover:text-zinc-950 dark:text-zinc-400 dark:group-hover:text-zinc-50">
                    {idea.title}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/posts"
              className="group mt-6 inline-flex items-center gap-1 rounded-lg text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              All writing
              <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </SectionV1>

          <SectionV1 heading="Projects" index={3}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {selectedProjects.map((project) => {
                const starCount = formatStarCount(project.stars);
                return (
                  <a
                    key={project.name}
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-lg p-3 transition-colors hover:bg-zinc-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:hover:bg-zinc-900/70 dark:focus-visible:ring-teal-400"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-zinc-900 transition-colors group-hover:text-teal-600 dark:text-zinc-100 dark:group-hover:text-teal-400">
                        {createElement(getProjectIcon(project.icon), {
                          size: 14,
                          weight: "regular",
                          className: "shrink-0 text-muted",
                        })}
                        <span className="truncate">{project.name}</span>
                      </span>
                      {starCount ? (
                        <span className="flex shrink-0 items-center gap-1 font-mono text-xs tabular-nums text-muted">
                          <Star size={12} weight="regular" />
                          {starCount}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{project.description}</p>
                    {project.role === "core contributor" ? (
                      <p className="mt-1 text-xs text-muted">core contributor</p>
                    ) : null}
                  </a>
                );
              })}
            </div>
            <Link
              href="/projects"
              className="group mt-6 inline-flex items-center gap-1 rounded-lg text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              All projects
              <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </SectionV1>

          <SectionV1 heading="More" index={4}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/press"
                prefetch={false}
                className="group inline-flex items-center gap-1 rounded-lg text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Press: books, quotes, and newsletters that cite my work
                <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/talks"
                className="group inline-flex items-center gap-1 rounded-lg text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Talks: conference talks, appearances, and community panels
                <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/listening"
                prefetch={false}
                className="group inline-flex items-center gap-1 rounded-lg text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Listening: what I have been playing on Spotify lately
                <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/stack"
                prefetch={false}
                className="group inline-flex items-center gap-1 rounded-lg text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Stack: the hardware, apps, and tools I use every day
                <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </SectionV1>

          <SectionV1 heading="Reach me" index={5}>
            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
              Find me on{" "}
              <a href="mailto:mark@markstuart.dev" target="_blank" rel="noopener noreferrer" className={inlineLinkClass}>
                Email
              </a>
              ,{" "}
              <a href="https://github.com/mstuart" target="_blank" rel="noopener noreferrer" className={inlineLinkClass}>
                GitHub
              </a>
              ,{" "}
              <a
                href="https://www.linkedin.com/in/markastuart/"
                target="_blank"
                rel="noopener noreferrer"
                className={inlineLinkClass}
              >
                LinkedIn
              </a>
              , or{" "}
              <a href="https://x.com/markstuartdev" target="_blank" rel="noopener noreferrer" className={inlineLinkClass}>
                X
              </a>
              .
            </p>
            <div className="mt-4">
              <SocialLinks />
            </div>
            <p className="mt-3 text-sm text-muted">
              Elsewhere:{" "}
              <a
                href="https://medium.com/@mark_stuart"
                target="_blank"
                rel="noopener noreferrer"
                className={inlineLinkClass}
              >
                Medium
              </a>
              ,{" "}
              <a
                href="https://github.com/mstuart"
                target="_blank"
                rel="noopener noreferrer"
                className={inlineLinkClass}
              >
                GitHub
              </a>
              ,{" "}
              <a href="https://www.npmjs.com/~mstuart" target="_blank" rel="noopener noreferrer" className={inlineLinkClass}>
                npm
              </a>
              , and{" "}
              <a
                href="https://speakerdeck.com/mstuart"
                target="_blank"
                rel="noopener noreferrer"
                className={inlineLinkClass}
              >
                Speaker Deck
              </a>
              .
            </p>
            <p className="mt-3 text-sm text-muted">
              Prefer a terminal?{" "}
              <Link href="/tui" className={inlineLinkClass}>
                Launch the CLI
              </Link>
              .
            </p>
          </SectionV1>
        </div>
      </div>
    </div>
  );
}
