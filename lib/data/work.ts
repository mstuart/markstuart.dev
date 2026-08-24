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
    role: "Staff Software Engineer to Director of Engineering",
    period: "Nov 2013 to Sep 2022",
    summary:
      "Led Checkout platform modernization and helped drive PayPal's early adoption of GraphQL.",
  },
  {
    company: "Qplay, Inc.",
    role: "Sr. Software Engineer",
    period: "Apr 2013 to Nov 2013",
    summary:
      "First UI engineer at a video-discovery startup founded by TiVo alumni.",
  },
  {
    company: "PayPal",
    role: "Sr. Software Engineer",
    period: "Jul 2012 to Apr 2013",
    summary:
      "Helped modernize Checkout with Node.js and contributed to PayPal's shared JavaScript SDK.",
  },
  {
    company: "State Farm Insurance",
    role: "Software Engineer",
    period: "May 2007 to Jul 2012",
    summary:
      "Built Web platforms and led the Mobile Web single-page application rebuild.",
  },
];
