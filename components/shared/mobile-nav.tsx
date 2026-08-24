"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";
import { ActiveNavLink } from "@/components/shared/active-nav-link";
import { SocialLinks } from "@/components/shared/social-links";

interface NavLink {
  href: string;
  label: string;
  prefetch?: boolean;
}

const FOCUSABLE_SELECTOR = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

// Keying the stateful drawer to the pathname guarantees that every route
// transition closes it, including a later Back navigation to the old route.
export function MobileNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return <MobileNavForPath key={pathname} links={links} pathname={pathname} />;
}

function MobileNavForPath({ links, pathname }: { links: NavLink[]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const activeDialog: HTMLDivElement = dialog;

    const background = Array.from(new Set([
      ...Array.from(document.body.children, (element) => element as HTMLElement),
      ...Array.from(document.querySelectorAll<HTMLElement>("header, main, footer")),
    ])).filter((element) => element !== dialog && !dialog.contains(element));
    const previouslyInert = new Map(background.map((element) => [element, element.hasAttribute("inert")]));
    const firstControl = dialog.querySelector<HTMLElement>("a[href]") ?? dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    const desktopMedia = window.matchMedia("(min-width: 768px)");

    background.forEach((element) => element.setAttribute("inert", ""));
    firstControl?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(activeDialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function containFocus(event: FocusEvent) {
      if (event.target instanceof Node && !activeDialog.contains(event.target)) firstControl?.focus();
    }

    function closeAtDesktop(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", containFocus);
    desktopMedia.addEventListener("change", closeAtDesktop);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", containFocus);
      desktopMedia.removeEventListener("change", closeAtDesktop);
      document.body.style.overflow = previousOverflow;
      for (const element of background) {
        if (!previouslyInert.get(element)) element.removeAttribute("inert");
      }
      previousFocusRef.current?.focus();
    };
  }, [open]);

  function openMenu() {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-navigation-dialog"
        onClick={openMenu}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <List size={20} weight="regular" />
      </button>

      {open
        ? createPortal(
            <div
              ref={dialogRef}
              id="mobile-navigation-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-navigation-title"
              className="fixed inset-0 z-50 overflow-y-auto bg-zinc-50 dark:bg-zinc-950"
            >
              <h2 id="mobile-navigation-title" className="sr-only">Site navigation</h2>
              <nav className="mx-auto flex max-w-2xl flex-col px-4 pb-4 pt-16">
                {links.map((link) => (
                  <ActiveNavLink
                    key={link.href}
                    href={link.href}
                    prefetch={link.prefetch}
                    className={`flex min-h-12 items-center rounded-md px-2 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400 ${
                      pathname === link.href
                        ? "text-accent"
                        : "text-zinc-700 hover:text-teal-600 dark:text-zinc-300 dark:hover:text-teal-400"
                    }`}
                  >
                    {link.label}
                  </ActiveNavLink>
                ))}
                <div className="mt-3 border-t border-zinc-200 px-2 pt-4 dark:border-zinc-800">
                  <SocialLinks />
                </div>
              </nav>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={20} weight="regular" />
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
