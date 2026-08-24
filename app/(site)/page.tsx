import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { site } from "@/lib/data/site";
import { pageMetadata, personJsonLd, serializeJsonLd } from "@/lib/metadata";

const homeMetadata = pageMetadata({
  title: site.name,
  description: site.description,
  path: "/",
});

export const metadata: Metadata = {
  ...homeMetadata,
  title: { absolute: site.name },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(personJsonLd) }}
      />
      <HomePage />
    </>
  );
}
