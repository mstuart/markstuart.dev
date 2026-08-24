import type { WorkEntry } from "@/lib/types";

// Summaries trace to lib/data/resume.ts (the authoritative role history) and
// are written to complement, not repeat, the homepage hero copy.
export const work: WorkEntry[] = [
  {
    company: "Rocket",
    role: "Distinguished Engineer",
    period: "May 2025 to now",
    summary:
      "Leads AI-enabled engineering and API platform strategy, including post-acquisition integration work.",
  },
  {
    company: "eBay",
    role: "Distinguished Engineer",
    period: "Oct 2022 to May 2025",
    summary:
      "Led technical strategy for eBay Live and improved performance across flagship Web experiences.",
  },
  {
    company: "PayPal",
    role: "Sr. Principal Engineer",
    period: "Nov 2013 to Sep 2022",
    summary:
      "Led Checkout Web, PayPal SDKs, and Web Platform; drove GraphQL adoption company-wide and led a large engineering organization.",
  },
];
