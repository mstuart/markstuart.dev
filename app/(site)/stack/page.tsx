import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { cliTools, PLATFORM_ORDER, stackSections, type Platform } from "@/lib/data/stack";
import { pageMetadata } from "@/lib/metadata";
import { getProjectIcon } from "@/lib/project-icons";

export const metadata = pageMetadata({
  title: "Stack",
  description: "A curated toolkit for design and development.",
  path: "/stack",
});

function sortTags(tags: Platform[]): Platform[] {
  return [...tags].sort((a, b) => PLATFORM_ORDER.indexOf(a) - PLATFORM_ORDER.indexOf(b));
}

export default function StackPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-medium text-zinc-900 dark:text-zinc-100">Stack</h1>
      <p className="mt-2 text-sm text-muted">
        A curated toolkit for design and development.
      </p>

      {stackSections.map((section) => (
        <section key={section.heading} className="mt-10">
          <h2 className="text-sm font-medium text-muted">{section.heading}</h2>
          <ul className="mt-4 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {section.items.map((item) => {
              const FallbackIcon = getProjectIcon(item.icon);
              return (
              <li key={item.name}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-md px-2 py-3 -mx-2 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:hover:bg-zinc-900 dark:focus-visible:ring-teal-400"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-zinc-100/10">
                    {item.iconSrc ? (
                      <Image src={item.iconSrc} alt="" width={32} height={32} className="h-full w-full object-contain" />
                    ) : (
                      <FallbackIcon size={16} weight="regular" className="text-muted" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-zinc-900 transition-colors group-hover:text-teal-600 dark:text-zinc-100 dark:group-hover:text-teal-400">
                      {item.name}
                      <ArrowUpRight size={12} weight="regular" className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                    <span className="block text-sm text-muted">{item.description}</span>
                  </span>
                  <span className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
                    {sortTags(item.tags).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted dark:bg-zinc-900"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                </a>
              </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted">Command line</h2>
        <p className="mt-3 text-sm text-muted">
          A compact set of command-line tools for navigation, search, builds, and version control.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {cliTools.map((tool) => (
            <a
              key={tool.name}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-sm text-zinc-700 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
            >
              {tool.name}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
