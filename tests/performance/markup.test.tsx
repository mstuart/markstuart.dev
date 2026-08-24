import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { describe, expect, it } from "vitest";
import StackPage from "@/app/(site)/stack/page";
import { HomePage } from "@/components/home-page";
import { ActiveNavLink } from "@/components/shared/active-nav-link";
import { SiteHeader } from "@/components/shared/site-header";

function collectElements(node: ReactNode): ReactElement[] {
  if (!isValidElement(node)) {
    return [];
  }

  const element = node as ReactElement<{ children?: ReactNode }>;
  return [
    element,
    ...Children.toArray(element.props.children).flatMap((child) => collectElements(child)),
  ];
}

describe("measured homepage prefetch policy", () => {
  it("disables prefetch only for the measured heavy specialty routes", () => {
    const links = collectElements(HomePage()).filter((element) => element.type === Link);
    const propsByHref = new Map(
      links.map((element) => {
        const props = element.props as { href: string; prefetch?: boolean };
        return [props.href, props];
      }),
    );

    expect(propsByHref.get("/press")?.prefetch).toBe(false);
    expect(propsByHref.get("/listening")?.prefetch).toBe(false);
    expect(propsByHref.get("/stack")?.prefetch).toBe(false);
    expect(propsByHref.get("/talks")?.prefetch).toBeUndefined();
  });

  it("preserves the measured heavy-route policy in persistent navigation", () => {
    const links = collectElements(SiteHeader()).filter(
      (element) => element.type === ActiveNavLink,
    );
    const propsByHref = new Map(
      links.map((element) => {
        const props = element.props as { href: string; prefetch?: boolean };
        return [props.href, props];
      }),
    );

    expect(propsByHref.get("/press")?.prefetch).toBe(false);
    expect(propsByHref.get("/listening")?.prefetch).toBe(false);
    expect(propsByHref.get("/stack")?.prefetch).toBe(false);
    expect(propsByHref.get("/talks")?.prefetch).toBeUndefined();
  });
});

describe("Stack asset delivery", () => {
  it("does not render stored product or tool images", () => {
    const storedImageSources = collectElements(StackPage())
      .filter((element) => element.type === Image)
      .map((element) => (element.props as { src: string }).src);

    expect(storedImageSources).toEqual([]);
  });
});
