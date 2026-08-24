// @vitest-environment node

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProjectCaseStudyPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from "@/app/(site)/projects/[slug]/page";
import { projectCaseStudies } from "@/lib/data/project-case-studies";

describe("project case study data", () => {
  it("defines exactly the three public case studies with complete evidence-backed sections", () => {
    expect(projectCaseStudies.map((study) => study.slug)).toEqual([
      "peek",
      "tare",
      "graphql-agent-toolkit",
    ]);

    for (const study of projectCaseStudies) {
      expect(study.title).not.toBe("");
      expect(study.description).not.toBe("");
      expect(study.problem.length).toBeGreaterThan(0);
      expect(study.whyExistingApproachesFallShort.length).toBeGreaterThan(0);
      expect(study.approach.length).toBeGreaterThan(0);
      expect(study.proof.length).toBeGreaterThan(0);
      expect(study.tradeoffs.length).toBeGreaterThan(0);
      expect(study.lessons.length).toBeGreaterThan(0);
      expect(study.links).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "GitHub", href: expect.stringMatching(/^https:\/\//) }),
        ]),
      );
    }
  });
});

describe("project case study routes", () => {
  it("pre-renders only known slugs with route-specific metadata", async () => {
    expect(dynamicParams).toBe(false);
    expect(generateStaticParams()).toEqual([
      { slug: "peek" },
      { slug: "tare" },
      { slug: "graphql-agent-toolkit" },
    ]);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "tare" }),
    });

    expect(metadata).toMatchObject({
      title: "tare",
      description: expect.stringContaining("context compression"),
      alternates: { canonical: "/projects/tare" },
      openGraph: { url: "/projects/tare" },
      twitter: { card: "summary_large_image" },
    });
  });

  it("renders the complete case study and its public resource links", async () => {
    const markup = renderToStaticMarkup(
      await ProjectCaseStudyPage({ params: Promise.resolve({ slug: "tare" }) }),
    );

    for (const heading of [
      "Problem",
      "Why existing approaches fall short",
      "Approach and architecture",
      "Proof",
      "Key tradeoffs",
      "Lessons",
    ]) {
      expect(markup).toContain(`>${heading}<`);
    }

    expect(markup).toContain('href="https://github.com/mstuart/tare"');
    expect(markup).toContain('href="https://www.npmjs.com/package/tare-ai"');
    expect(markup).toContain('href="https://github.com/mstuart/tare/tree/main/docs"');
  });
});
