import { SocialLinks } from "@/components/shared/social-links";
import { site } from "@/lib/data/site";

export function SiteFooter() {
  return (
    <footer>
      <div className="flex flex-col items-center px-6 pb-12 pt-10">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
          {site.name}
        </p>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-8 text-sm text-muted sm:flex-row sm:justify-between">
          <p className="flex items-center gap-3">
            <span>&copy; {new Date().getFullYear()} {site.name}</span>
            <a
              href="https://github.com/mstuart/markstuart.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-sm underline decoration-zinc-400 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Source
            </a>
          </p>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
