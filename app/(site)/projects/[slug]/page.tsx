import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import {
  getProjectCaseStudy,
  projectCaseStudies,
} from "@/lib/data/project-case-studies";
import { pageMetadata } from "@/lib/metadata";

interface ProjectCaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return projectCaseStudies.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProjectCaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectCaseStudy(slug);

  if (!project) return {};

  return pageMetadata({
    title: project.title,
    description: project.description,
    path: `/projects/${project.slug}`,
  });
}

export default async function ProjectCaseStudyPage({ params }: ProjectCaseStudyPageProps) {
  const { slug } = await params;
  const project = getProjectCaseStudy(slug);

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ArrowLeft aria-hidden="true" size={14} weight="regular" />
        Projects
      </Link>

      <article className="mt-8">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
            Project case study
          </p>
          <h1 className="mt-3 text-2xl font-medium text-foreground">{project.title}</h1>
          <p className="mt-4 text-[17px] leading-8 text-zinc-700 dark:text-zinc-300">
            {project.summary}
          </p>
          <ul aria-label="Project resources" className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {project.links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-sm text-sm text-muted underline decoration-dotted underline-offset-4 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {link.label}
                  <ArrowUpRight aria-hidden="true" size={12} weight="regular" />
                </a>
              </li>
            ))}
          </ul>
        </header>

        <section className="mt-12">
          <h2 className="text-sm font-medium text-foreground">Problem</h2>
          <div className="mt-4 space-y-4 text-[15px] leading-7 text-muted">
            {project.problem.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium text-foreground">
            Why existing approaches fall short
          </h2>
          <div className="mt-4 space-y-4 text-[15px] leading-7 text-muted">
            {project.whyExistingApproachesFallShort.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium text-foreground">Approach and architecture</h2>
          <div className="mt-4 divide-y divide-line border-y border-line">
            {project.approach.map((item) => (
              <div key={item.title} className="py-5">
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium text-foreground">Proof</h2>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            {project.proof.map((item) => (
              <div key={item.title} className="py-5">
                <dt className="font-medium text-foreground">{item.title}</dt>
                <dd className="mt-2 text-sm leading-7 text-muted">
                  {item.detail}{" "}
                  <a
                    href={item.sourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm underline decoration-dotted underline-offset-4 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {item.sourceLabel}
                  </a>
                  .
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium text-foreground">Key tradeoffs</h2>
          <ul className="mt-4 flex list-disc flex-col gap-3 pl-4 text-sm leading-7 text-muted marker:text-zinc-300 dark:marker:text-zinc-700">
            {project.tradeoffs.map((tradeoff) => (
              <li key={tradeoff}>{tradeoff}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium text-foreground">Lessons</h2>
          <ol className="mt-4 flex list-decimal flex-col gap-3 pl-4 text-sm leading-7 text-muted marker:font-mono marker:text-xs marker:text-zinc-400 dark:marker:text-zinc-600">
            {project.lessons.map((lesson) => (
              <li key={lesson} className="pl-1">
                {lesson}
              </li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}
