import Link from "next/link";
import { ArrowRight, ArrowUpRight, Star } from "@phosphor-icons/react/dist/ssr";
import { SocialLinks } from "@/components/shared/social-links";
import { SectionV1 } from "@/components/v1/section";
import styles from "@/components/v1/entrance.module.css";
import { PixelScene5 } from "@/components/px/scene5";
import { PixelAvatar } from "@/components/px/avatar";
import { formatStarCount } from "@/lib/format";
import { projects } from "@/lib/data/projects";
import { getProjectIcon } from "@/lib/project-icons";
import { work } from "@/lib/data/work";
import { writing } from "@/lib/data/writing";
import { getAllPosts } from "@/lib/posts";

function formatViews(views: number): string {
  if (views >= 1000) {
    const thousands = views / 1000;
    const value = Number.isInteger(thousands) ? String(thousands) : thousands.toFixed(1);
    return `${value}K`;
  }
  return String(views);
}

type WritingRow =
  | { kind: "local"; slug: string; title: string; date: string }
  | { kind: "external"; title: string; date: string; url: string; views?: number };

const inlineLinkClass =
  "rounded-lg text-zinc-900 underline decoration-dotted underline-offset-4 transition-colors hover:text-teal-600 hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-100 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400";

const chipClass =
  "inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-zinc-700 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400";

function LogoChip({ name, src, href }: { name: string; src: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={chipClass}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={16} height={16} className="h-4 w-4 rounded-[3px] object-contain" />
      {name}
    </a>
  );
}

function ProjectChip({ name, icon, href }: { name: string; icon?: string; href: string }) {
  const Icon = getProjectIcon(icon);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={chipClass}>
      <Icon size={14} weight="regular" className="shrink-0 text-zinc-400 dark:text-zinc-500" />
      {name}
    </a>
  );
}

export function HomePage() {
  // The homepage grid shows current authored work (the same curated Featured
  // set as /projects), not the star-ranked PayPal-era core contributions.
  const selectedProjects = projects
    .filter((project) => project.role === "author")
    .sort((a, b) => ((a.createdAt ?? "") < (b.createdAt ?? "") ? 1 : -1))
    .slice(0, 6);
  const localWritingRows: WritingRow[] = getAllPosts().map((post) => ({
    kind: "local",
    slug: post.slug,
    title: post.title,
    date: post.date,
  }));
  const externalWritingRows: WritingRow[] = writing.map((entry) => ({
    kind: "external",
    title: entry.title,
    date: entry.date,
    url: entry.url,
    views: entry.views,
  }));
  const recentWriting = [...localWritingRows, ...externalWritingRows]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="relative">
      <PixelScene5 />
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <div className="space-y-20">
          <header className={`${styles.fadeUp} relative`}>
            <div className="flex items-center gap-4">
              <PixelAvatar />
              <div>
                <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                  Mark Stuart
                </h1>
              </div>
            </div>

            <div className="mt-8 space-y-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
              <p>
                I build platforms, guardrails, and engineering cultures that let organizations ship
                faster at higher quality. My thesis: the highest-leverage engineering skill is no
                longer writing code. It&apos;s writing the specifications, paved roads, and agentic
                workflows that let AI agents execute against them. Invest in the rails, not the
                train.
              </p>
              <p>
                For 15+ years I&apos;ve built those rails at PayPal, eBay, and now Rocket, with one
                consistent through-line: turning fragmented systems and teams into composable
                platforms that accelerate everyone around them.
              </p>
              <p>
                At Rocket, I led our shift to AI-native development: an agent skills marketplace,
                reusable agentic workflows, and the guardrail framework that governs what agents do
                autonomously. Agents built on that platform now open 80% of our pull requests.
              </p>
              <p>
                My open source work lives on{" "}
                <a href="https://github.com/mstuart" target="_blank" rel="noopener noreferrer" className={inlineLinkClass}>
                  GitHub
                </a>
                : current experiments in agent tooling, alongside PayPal-era projects like zoid and
                lusca that are still widely used today.
              </p>
            </div>

            <div className="mt-6 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span>Now at</span>
                <LogoChip name="Rocket" src="/work/rocket.png" href="https://www.rocketcompanies.com/" />
                <span>previously</span>
                <LogoChip name="PayPal" src="/work/paypal.png" href="https://www.paypal.com/" />
                <LogoChip name="eBay" src="/work/ebay.png" href="https://www.ebay.com/" />
              </p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span>Building</span>
                <ProjectChip name="peek" icon="Gauge" href="https://github.com/mstuart/peek" />
                <ProjectChip name="vitals" icon="Cloud" href="https://github.com/mstuart/vitals" />
                <ProjectChip name="tare" icon="PlugsConnected" href="https://github.com/mstuart/tare" />
              </p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span>Core contributor to</span>
                <ProjectChip name="zoid" icon="PlugsConnected" href="https://github.com/krakenjs/zoid" />
                <ProjectChip name="lusca" icon="ShieldCheck" href="https://github.com/krakenjs/lusca" />
                <ProjectChip
                  name="paypal-checkout-components"
                  icon="Package"
                  href="https://github.com/paypal/paypal-checkout-components"
                />
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
                      <span className="text-zinc-500 dark:text-zinc-400"> at {entry.company}</span>
                    </p>
                    {entry.summary ? (
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{entry.summary}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">{entry.period}</span>
                </div>
              ))}
            </div>
            <Link
              href="/work"
              className="group mt-6 inline-flex items-center gap-1 rounded-lg text-sm text-zinc-500 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
            >
              Full resume
              <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </SectionV1>

          <SectionV1 heading="Writing" index={2}>
            <div className="flex flex-col">
              {recentWriting.map((item) =>
                item.kind === "local" ? (
                  <Link
                    key={item.slug}
                    href={`/posts/${item.slug}`}
                    className="group flex items-baseline justify-between gap-4 rounded-lg px-2 py-3 -mx-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400"
                  >
                    <span className="truncate text-zinc-600 transition-colors group-hover:text-zinc-950 dark:text-zinc-400 dark:group-hover:text-zinc-50">
                      {item.title}
                    </span>
                  </Link>
                ) : (
                  <a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline justify-between gap-4 rounded-lg px-2 py-3 -mx-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400"
                  >
                    <span className="inline-flex min-w-0 items-center gap-1 truncate text-zinc-600 transition-colors group-hover:text-teal-600 dark:text-zinc-400 dark:group-hover:text-teal-400">
                      <span className="truncate">{item.title}</span>
                      <ArrowUpRight size={12} weight="regular" className="shrink-0" />
                    </span>
                    {item.views ? (
                      <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                        {formatViews(item.views)} views
                      </span>
                    ) : null}
                  </a>
                )
              )}
            </div>
            <Link
              href="/posts"
              className="group mt-6 inline-flex items-center gap-1 rounded-lg text-sm text-zinc-500 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
            >
              All writing
              <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </SectionV1>

          <SectionV1 heading="Projects" index={3}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {selectedProjects.map((project) => {
                const starCount = formatStarCount(project.stars);
                const Icon = getProjectIcon(project.icon);
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
                        <Icon size={14} weight="regular" className="shrink-0 text-zinc-400 dark:text-zinc-500" />
                        <span className="truncate">{project.name}</span>
                      </span>
                      {starCount ? (
                        <span className="flex shrink-0 items-center gap-1 font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                          <Star size={12} weight="regular" />
                          {starCount}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{project.description}</p>
                    {project.role === "core contributor" ? (
                      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">core contributor</p>
                    ) : null}
                  </a>
                );
              })}
            </div>
            <Link
              href="/projects"
              className="group mt-6 inline-flex items-center gap-1 rounded-lg text-sm text-zinc-500 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
            >
              All projects
              <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </SectionV1>

          <SectionV1 heading="More" index={4}>
            <div className="flex flex-col gap-3">
              <Link
                href="/press"
                className="group inline-flex items-center gap-1 rounded-lg text-sm text-zinc-500 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
              >
                Press: books, quotes, and newsletters that cite my work
                <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/talks"
                className="group inline-flex items-center gap-1 rounded-lg text-sm text-zinc-500 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
              >
                Talks: conference talks, appearances, and community panels
                <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/listening"
                className="group inline-flex items-center gap-1 rounded-lg text-sm text-zinc-500 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
              >
                Listening: what I have been playing on Spotify lately
                <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/stack"
                className="group inline-flex items-center gap-1 rounded-lg text-sm text-zinc-500 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
              >
                Stack: the hardware, apps, and tools I use every day
                <ArrowRight size={14} weight="regular" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </SectionV1>

          <SectionV1 heading="Reach me" index={5}>
            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
              Find me on{" "}
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
              <a href="https://x.com/mark__stu" target="_blank" rel="noopener noreferrer" className={inlineLinkClass}>
                X
              </a>
              .
            </p>
            <div className="mt-4">
              <SocialLinks />
            </div>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Elsewhere:{" "}
              <a
                href="https://speakerdeck.com/mstuart"
                target="_blank"
                rel="noopener noreferrer"
                className={inlineLinkClass}
              >
                Speaker Deck
              </a>
              ,{" "}
              <a href="https://www.npmjs.com/~mstuart" target="_blank" rel="noopener noreferrer" className={inlineLinkClass}>
                npm
              </a>
              , and{" "}
              <a
                href="https://medium.com/@mark_stuart"
                target="_blank"
                rel="noopener noreferrer"
                className={inlineLinkClass}
              >
                Medium
              </a>
              .
            </p>
          </SectionV1>
        </div>
      </div>
    </div>
  );
}
