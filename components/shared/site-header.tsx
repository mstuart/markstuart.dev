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
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-3 px-4 text-sm sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 whitespace-nowrap font-medium text-zinc-900 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-md dark:text-zinc-100 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
        >
          <span aria-hidden="true" className="block h-7 w-7 shrink-0 overflow-hidden rounded-md">
            <span className="block origin-top-left scale-50">
              <PixelMonogram2 />
            </span>
          </span>
          {site.name}
        </Link>
        <nav className="hidden items-center gap-2 md:flex lg:gap-4">
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
        <div className="flex shrink-0 items-center gap-1">
          <div className="hidden lg:flex">
            <SocialLinks />
          </div>
          <Link
            href="/tui"
            aria-label="Launch terminal mode"
            title="Launch terminal mode"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
