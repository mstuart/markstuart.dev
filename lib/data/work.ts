import type { WorkEntry } from "@/lib/types";

// Summaries trace to lib/data/resume.ts (the authoritative role history) and
// are written to complement, not repeat, the homepage hero copy.
export const work: WorkEntry[] = [
  {
    company: "Rocket",
    role: "Distinguished Engineer",
    period: "2025 to now",
    summary:
      "Architected Rocket's federated GraphQL platform and led the engineering integration of Mr. Cooper, the largest US mortgage servicer, into Rocket's stack.",
  },
  {
    company: "eBay",
    role: "Distinguished Engineer",
    period: "2022 to 2025",
    summary:
      "Led architecture and technical strategy for eBay Live, eBay's real-time video commerce platform, and drove tens of millions in incremental GMV by cutting core web vitals 50-60% across flagship products.",
  },
  {
    company: "PayPal",
    role: "Sr. Software Engineer to Director of Engineering",
    period: "2012 to 2022",
    summary:
      "Architected PayPal's Checkout platform and drove the company's early adoption of GraphQL, building the initial infrastructure and tooling years before federation existed.",
  },
];
