import Link from "next/link";
import { TerminalWindow } from "@phosphor-icons/react/dist/ssr";
import { PixelMonogram2 } from "@/components/px/monogram2";
import { ActiveNavLink } from "@/components/shared/active-nav-link";
import { MobileNav } from "@/components/shared/mobile-nav";
import { SocialLinks } from "@/components/shared/social-links";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { site } from "@/lib/data/site";

const navLinks = [
  { href: "/work", label: "Work" },
  { href: "/posts", label: "Writing" },
  { href: "/projects", label: "Projects" },
  { href: "/press", label: "Press", prefetch: false },
  { href: "/talks", label: "Talks" },
  { href: "/listening", label: "Listening", prefetch: false },
  { href: "/stack", label: "Stack", prefetch: false },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="site-header-inner mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 text-sm sm:px-6">
        <Link
          href="/"
          aria-label={site.name}
          className="site-header-brand flex min-h-11 min-w-0 items-center gap-2 whitespace-nowrap rounded-md font-medium text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span aria-hidden="true" className="site-header-mark block h-7 w-7 shrink-0 overflow-hidden rounded-md">
            <span className="block origin-top-left scale-50">
              <PixelMonogram2 />
            </span>
          </span>
          <span className="site-header-label">{site.name}</span>
        </Link>
        <nav className="hidden shrink-0 items-center gap-2 md:flex lg:gap-4">
          {navLinks.map((link) => (
            <ActiveNavLink
              key={link.href}
              href={link.href}
              prefetch={link.prefetch}
              className="whitespace-nowrap rounded-md px-1 py-2 text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {link.label}
            </ActiveNavLink>
          ))}
        </nav>
        <div className="site-header-actions flex shrink-0 items-center gap-1">
          <div className="hidden lg:flex">
            <SocialLinks />
          </div>
          <Link
            href="/tui"
            aria-label="Launch terminal mode"
            title="Launch terminal mode"
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <TerminalWindow size={18} weight="regular" />
          </Link>
          <ThemeToggle />
          <MobileNav links={navLinks} />
        </div>
      </div>
    </header>
  );
}
