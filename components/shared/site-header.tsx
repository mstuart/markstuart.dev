import Link from "next/link";
import { PixelMonogram2 } from "@/components/px/monogram2";
import { SocialLinks } from "@/components/shared/social-links";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { site } from "@/lib/data/site";

const navLinks = [
  { href: "/work", label: "Work" },
  { href: "/posts", label: "Writing" },
  { href: "/projects", label: "Projects" },
  { href: "/press", label: "Press" },
  { href: "/talks", label: "Talks" },
  { href: "/listening", label: "Listening" },
  { href: "/stack", label: "Stack" },
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
        <nav className="flex items-center gap-2 sm:gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-zinc-500 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-md dark:text-zinc-400 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <div className="hidden sm:flex">
            <SocialLinks />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
