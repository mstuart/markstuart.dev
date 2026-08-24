// Role history traces to Mark's resume and LinkedIn profile. The public
// summaries preserve that history while omitting employer-internal detail.

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
  "Nearly two decades in software engineering, with platform leadership roles at PayPal, eBay, and now Rocket. Today I lead AI-enabled engineering and platform initiatives.";

export const focusAreas = [
  "AI-Enabled Engineering",
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

export const resumeRoles: ResumeRole[] = [
  {
    company: "Rocket",
    title: "Distinguished Engineer",
    start: "2025-05",
    end: "Present",
    short:
      "Rocket's first Distinguished Engineer, leading AI-enabled engineering, API platform strategy, and post-acquisition integration.",
    bullets: [
      "Leads AI-enabled engineering initiatives, shared tooling, and responsible adoption practices across engineering.",
      "Provides technical leadership for Rocket's API platform, including federated GraphQL.",
      "Led engineering integration work following Rocket's acquisition of Mr. Cooper, coordinating platform and product work across teams.",
      "Improved shared platform reliability, observability, and engineering quality practices.",
      "Helped shape Rocket Technology's technical career framework, senior engineering interviews, and engineering learning programs.",
    ],
  },
  {
    company: "eBay",
    title: "Distinguished Engineer",
    start: "2022-10",
    end: "2025-05",
    short:
      "Set technical direction for consumer Web and Mobile platforms and led technical strategy for eBay Live.",
    bullets: [
      "Set technical direction for eBay's consumer Web and Mobile platforms.",
      "Led technical strategy for eBay Live and partnered across product, design, and marketing to bring the format to market.",
      "Improved web performance and business outcomes across flagship products.",
      "Expanded delivery automation across eBay's Node.js estate.",
      "Set shared Web and Node.js engineering standards and helped teams make consistent technical decisions.",
    ],
  },
  {
    company: "PayPal",
    title: "Director of Engineering",
    start: "2021-02",
    end: "2022-09",
    short: "Built and led a new developer-platform org responsible for PayPal's SDKs.",
    bullets: [
      "Built and led a developer-platform organization responsible for SDK strategy across PayPal products.",
    ],
  },
  {
    company: "PayPal",
    title: "Sr. Engineering Manager",
    start: "2019-06",
    end: "2021-02",
    short: "Led PayPal's Web and Node.js platform organization.",
    bullets: [
      "Led PayPal's Web and Node.js platform organization, rebuilding the team and refocusing the roadmap on developer needs.",
      "Delivered shared GraphQL and front-end platform capabilities and partnered with senior leadership on platform strategy.",
    ],
  },
  {
    company: "PayPal",
    title: "Principal Engineer",
    start: "2017-07",
    end: "2019-05",
    short: "Owned Checkout's technical direction; drove PayPal's adoption of GraphQL.",
    bullets: [
      "Led Web platform modernization for PayPal's flagship Checkout product, improving performance and developer delivery.",
      "Drove PayPal's early adoption of GraphQL, building shared foundations and helping teams learn the technology.",
    ],
  },
  {
    company: "PayPal",
    title: "Sr. Staff Software Engineer",
    start: "2015-02",
    end: "2017-07",
    short: "Rebuilt Checkout's foundation with a small Product Infrastructure team.",
    bullets: [
      "Formed a Product Infrastructure team that modernized Checkout's Web and mobile foundations.",
    ],
  },
  {
    company: "PayPal",
    title: "Staff Software Engineer",
    start: "2013-11",
    end: "2015-02",
    short: "Lead engineer for PayPal's Consumer Web applications.",
    bullets: [
      "Led modernization of PayPal's Consumer Web applications and their shared platform foundations.",
      "Founded JSLunch and helped organize JS@PayPal, a company-wide engineering conference that continues today.",
    ],
  },
  {
    company: "Qplay, Inc.",
    title: "Sr. Software Engineer",
    start: "2013-04",
    end: "2013-11",
    short: "First UI engineer at the TiVo founders' video-discovery startup.",
    bullets: [
      "First UI engineer at a video-discovery startup founded by TiVo alumni. Built its hybrid mobile experience and helped grow the UI team.",
    ],
  },
  {
    company: "PayPal",
    title: "Sr. Software Engineer",
    start: "2012-07",
    end: "2013-04",
    short: "Part of the initial team that brought Node.js to PayPal.",
    bullets: [
      "Helped modernize Checkout with Node.js and contributed to PayPal's shared JavaScript SDK.",
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
