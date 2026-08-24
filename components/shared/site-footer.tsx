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
          <p>&copy; {new Date().getFullYear()} {site.name}</p>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
