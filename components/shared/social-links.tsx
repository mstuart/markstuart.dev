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
    <ul className={`flex items-center gap-1 ${className ?? ""}`}>
      {site.social.map((link) => {
        const Icon = icons[link.icon];
        return (
          <li key={link.name}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.name}
              className="flex h-11 w-11 items-center justify-center rounded-md text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Icon size={18} weight="regular" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
