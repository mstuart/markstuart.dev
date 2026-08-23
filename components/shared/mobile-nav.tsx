"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";
import { SocialLinks } from "@/components/shared/social-links";

interface NavLink {
  href: string;
  label: string;
}

// Below the `md` breakpoint the seven nav labels cannot fit on one row, so
// they collapse behind this menu button instead of overflowing the viewport.
export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change so the drawer never lingers over new content.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape, and lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 dark:focus-visible:ring-teal-400"
      >
        {open ? <X size={20} weight="regular" /> : <List size={20} weight="regular" />}
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          <nav className="mx-auto flex max-w-2xl flex-col px-4 py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-h-12 items-center rounded-md px-2 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400 ${
                  pathname === link.href
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-zinc-700 hover:text-teal-600 dark:text-zinc-300 dark:hover:text-teal-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-zinc-200 px-2 pt-4 dark:border-zinc-800">
              <SocialLinks />
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
