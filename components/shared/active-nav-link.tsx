"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ActiveNavLinkProps = ComponentProps<typeof Link>;

export function ActiveNavLink({ href, ...props }: ActiveNavLinkProps) {
  const pathname = usePathname();
  const hrefString = typeof href === "string" ? href : href.pathname;
  const isCurrentPage = pathname === hrefString;
  const isCurrentLocation = hrefString !== "/" && pathname.startsWith(`${hrefString}/`);

  return <Link href={href} aria-current={isCurrentPage ? "page" : isCurrentLocation ? "location" : undefined} {...props} />;
}
