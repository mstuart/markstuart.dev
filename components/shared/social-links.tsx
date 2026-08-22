import { GithubLogo, LinkedinLogo, XLogo } from "@phosphor-icons/react/dist/ssr";
import { site } from "@/lib/data/site";
import type { SocialIconKey } from "@/lib/types";

const icons: Record<SocialIconKey, typeof GithubLogo> = {
  github: GithubLogo,
  linkedin: LinkedinLogo,
  x: XLogo,
};

export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={`flex items-center gap-4 ${className ?? ""}`}>
      {site.social.map((link) => {
        const Icon = icons[link.icon];
        return (
          <li key={link.name}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.name}
              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
            >
              <Icon size={18} weight="regular" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
