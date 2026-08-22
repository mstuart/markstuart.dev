// Source of truth: Mark's own resume (versions/mark-stuart-2026-07.pdf) and
// LinkedIn profile export (2026-08). Bullets are his authored resume claims,
// lightly re-punctuated to follow the site's no-dash style rule.

export interface ResumeRole {
  company: string;
  title: string;
  start: string;
  end: string;
  /** One-line condensation used by the short view. */
  short: string;
  /** Full bullets used by the long view. */
  bullets: string[];
}

export const resumeSummary =
  "Distinguished Engineer with 15+ years at PayPal, eBay, and Rocket, currently leading Rocket's shift to AI-native software development alongside federated GraphQL and API platform architecture.";

export const focusAreas = [
  "AI-Native Engineering & Autonomous Development",
  "Platform Engineering at Scale",
  "Engineering Org Design & Hiring",
  "Speaking, Writing & Open Standards",
];

export const awards = [
  "eBay Critical Talent Award (2023)",
  "PayPal Key Talent Award (2022)",
  "PayPal Critical Talent Award (2019)",
  "PayPal Critical Talent Award (2017)",
  "PayPal Key Talent Award (2016)",
];

export const industryContributions = [
  "Published author on AI-native engineering, API platforms, GraphQL, and Node.js across Rocket Engineering, PayPal Engineering, and industry publications (400K+ views).",
  "Represented PayPal on the GraphQL Foundation's founding board (Linux Foundation).",
  "Featured engineer in Apollo GraphQL's flagship customer case study on API platform transformation at scale.",
  "Invited speaker and podcast guest on Node.js security, API platforms, GraphQL, and AI-driven product development.",
];

export const education =
  "Bachelor of Science, Information Systems, Magna Cum Laude, Illinois State University";

export const resumeRoles: ResumeRole[] = [
  {
    company: "Rocket",
    title: "Distinguished Engineer",
    start: "2025-05",
    end: "Present",
    short:
      "Rocket's first Distinguished Engineer: AI-native development platform, federated GraphQL API platform, and the Mr. Cooper integration.",
    bullets: [
      "Built Rocket's AI-native development platform: a company-wide agent skills marketplace (a shared, contributable library the org builds on), a library of reusable agentic workflows, and the evaluation and guardrail framework governing what agents can do autonomously versus what stays human-reviewed.",
      "As technical lead for the autonomous development pipeline built on that platform, architected the agents that now open pull requests across the org. Agents pick up work items, resolve CI failures, and remediate production errors. Built tooling that keeps PRs mergeable by resolving conflicts and responding to review feedback, plus reusable workflows for vulnerability remediation and error healing.",
      "Architected the federated GraphQL platform that serves as Rocket.com's unified API layer for Web, Mobile, IVR/Phone, and AI agents, consolidating mortgage, payments, and identity services into a single graph via Apollo Federation. Designed the facade so product surfaces integrate once while underlying services can be swapped beneath them without re-integrating every consumer.",
      "Led the engineering effort to integrate Mr. Cooper (the largest US mortgage servicer) into Rocket's stack post-acquisition. Onboarded hundreds of thousands of clients, merged core mortgage and identity systems, resolved cross-system boundary issues that would have failed at scale, and built per-client data access controls and cache invalidation for real-time consistency.",
      "Audited core API platforms and built shared libraries covering lifecycle, resiliency, health checks, and observability. Drove code quality and security scanning enforcement org-wide.",
      "Spearheaded Rocket Technology's technical career framework, including engineering career ladders and a competency matrix. Designed Rocket's Principal+ Engineer interview process and adapted it for AI-enabled interviews. Launched an AI Lunch & Learn series that accelerated adoption of AI-native workflows across engineering.",
    ],
  },
  {
    company: "eBay",
    title: "Distinguished Engineer",
    start: "2022-10",
    end: "2025-05",
    short:
      "Set technical direction for consumer Web and Mobile platforms across Payments, Identity, and Risk (800+ engineers); led eBay Live architecture.",
    bullets: [
      "Set technical direction for eBay's consumer Web and Mobile platforms across Payments, Identity, and Risk, influencing architecture decisions across 800+ engineers.",
      "Led architecture and technical strategy for eBay Live, a real-time video commerce and auction platform integrating live streaming, interactive bidding, and mobile-first UX. Partnered across product, design, and marketing to bring the format to market.",
      "Drove tens of millions in incremental GMV through web performance optimization. Reduced TTFB, LCP, FCP, and FID by 50-60% across flagship products.",
      "Scaled CI/CD automation from 55% to 95% across 300+ Node.js applications in one year.",
      "Chaired the Web Virtual Architecture Team (VAT), setting architectural standards for Node.js and web development across eBay. Authored and reviewed ADRs covering testing infrastructure, release tooling, and platform standards.",
    ],
  },
  {
    company: "PayPal",
    title: "Director of Engineering",
    start: "2021-02",
    end: "2022-09",
    short: "Built and led a new developer-platform org responsible for PayPal's SDKs.",
    bullets: [
      "Built and led a new organization responsible for PayPal's SDKs, which millions of merchants use to integrate payments into Web and Mobile apps. Unified SDK strategy across PayPal, Braintree, and Hyperwallet.",
    ],
  },
  {
    company: "PayPal",
    title: "Sr. Engineering Manager",
    start: "2019-06",
    end: "2021-02",
    short: "Turned around PayPal's Web and Node.js platform org (350+ apps, 800+ developers).",
    bullets: [
      "Took over PayPal's Web and Node.js platform org supporting 350+ apps and 800+ developers. Rebuilt the team and re-prioritized the roadmap around the most painful developer-facing issues.",
      "Shipped GraphQL infrastructure, a company-wide UI component explorer, and a complete SDLC for CDN deployments. Partnered with the CTO and senior leadership on strategic direction for the platform org.",
    ],
  },
  {
    company: "PayPal",
    title: "Principal Engineer",
    start: "2017-07",
    end: "2019-05",
    short: "Owned Checkout's technical direction; drove PayPal's adoption of GraphQL.",
    bullets: [
      "Architected \"Checkout Lite,\" the Web platform behind PayPal's flagship checkout product. Brought significant performance and revenue gains and cut provisioning-to-deploy time from hours to minutes for teams building on it.",
      "Drove the company's adoption of GraphQL. Built the initial infrastructure and tooling in the early days of GraphQL, before federation existed.",
      "Worked with technical leaders across PayPal, Braintree, Venmo, and Xoom and trained hundreds of engineers on GraphQL.",
    ],
  },
  {
    company: "PayPal",
    title: "Sr. Staff Software Engineer",
    start: "2015-02",
    end: "2017-07",
    short: "Rebuilt Checkout's foundation with a small Product Infrastructure team.",
    bullets: [
      "Formed a Product Infrastructure team that rebuilt Checkout's foundation: a Batch REST framework, HTML streaming with the Edge team, and Active/Active clustering that let Checkout scale beyond a single data center. Bootstrapped the Native Checkout team's React Native SDK for iOS and Android.",
    ],
  },
  {
    company: "PayPal",
    title: "Staff Software Engineer",
    start: "2013-11",
    end: "2015-02",
    short: "Lead engineer for all Consumer Web applications on paypal.com.",
    bullets: [
      "Lead engineer for all Consumer Web applications on paypal.com. Split the monolith into separate applications with shared API orchestration, winning buy-in from a 100+ engineer org, and built a configuration framework that let PayPal scale to new countries 5x faster.",
      "Founded JSLunch and helped organize JS@PayPal, a company-wide conference (300+ engineers across PayPal, Venmo, and Braintree; 30 talks, 8 workshops) that is still running today.",
    ],
  },
  {
    company: "Qplay, Inc.",
    title: "Sr. Software Engineer",
    start: "2013-04",
    end: "2013-11",
    short: "First UI engineer at the TiVo founders' video-discovery startup.",
    bullets: [
      "First UI engineer at a stealth startup from the TiVo founders, backed by Redpoint Ventures and Kleiner Perkins. Built a hybrid mobile app on Apache Cordova that paired with a TV device, before Chromecast and Fire Stick existed, and grew the UI team to 4 engineers.",
    ],
  },
  {
    company: "PayPal",
    title: "Sr. Software Engineer",
    start: "2012-07",
    end: "2013-04",
    short: "On the initial tiger team that brought Node.js to PayPal.",
    bullets: [
      "On the initial team that brought Node.js to PayPal, rebooting Checkout using LeanUX and rapid prototyping. Contributed to PayPal's first unified JavaScript SDK and CI/CD in the UI stack.",
    ],
  },
  {
    company: "State Farm Insurance",
    title: "Software Engineer",
    start: "2007-05",
    end: "2012-07",
    short: "Led the rebuild of State Farm's mobile web experience as a single-page app.",
    bullets: [
      "Software engineer across web platforms, including leading the Mobile Web single-page-app rebuild.",
    ],
  },
];
