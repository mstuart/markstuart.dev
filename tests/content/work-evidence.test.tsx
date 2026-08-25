import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ResumeView } from "@/components/resume-view";
import { resumeRoles } from "@/lib/data/resume";

const roleEvidence = [
  {
    role: "Distinguished Engineer at Rocket",
    links: [
      {
        label: "Rocket Technology: AI-authored static analysis",
        url: "https://careers.rocket.com/blog/technology-and-product/ai-authored-static-analysis-code-enforcement",
      },
      {
        label: "Rocket and Mr. Cooper acquisition",
        url: "https://www.rocketcompanies.com/press-release/mr-cooper-americas-largest-servicer-joins-rocket-the-nations-largest-lender/",
      },
    ],
  },
  {
    role: "Distinguished Engineer at eBay",
    links: [
      { label: "eBay Live", url: "https://www.ebay.com/ebaylive" },
      {
        label: "eBay Velocity Initiative",
        url: "https://www.infoq.com/presentations/platform-engineering-lessons/",
      },
    ],
  },
  {
    role: "Sr. Principal Engineer at PayPal",
    links: [
      {
        label: "PayPal Checkout components on GitHub",
        url: "https://github.com/paypal/paypal-checkout-components",
      },
      {
        label: "Faster PayPal integration experience",
        url: "https://developer.paypal.com/community/blog/faster-payments-integration/",
      },
      {
        label: "PayPal One Touch reaches 10M users",
        url: "https://newsroom.paypal-corp.com/10M-People-Use-One-Touch-TM-Just-Six-Months-After-Launch",
      },
    ],
  },
  {
    role: "Sr. Engineering Manager at PayPal",
    links: [
      {
        label: "Scaling GraphQL at PayPal",
        url: "https://medium.com/paypal-tech/scaling-graphql-at-paypal-b5b5ac098810",
      },
      {
        label: "Kraken.js Node.js framework and libraries",
        url: "https://github.com/krakenjs",
      },
    ],
  },
  {
    role: "Principal Engineer at PayPal",
    links: [
      {
        label: "GraphQL: A Success Story for PayPal Checkout",
        url: "https://medium.com/paypal-tech/graphql-a-success-story-for-paypal-checkout-3482f724fb53",
      },
      {
        label: "Apollo's PayPal GraphQL case study",
        url: "https://www.apollographql.com/customers/paypal",
      },
    ],
  },
  {
    role: "Staff Software Engineer at PayPal",
    links: [
      {
        label: "PayPal's mobile-first website",
        url: "https://techcrunch.com/2014/03/08/paypal-is-rolling-out-its-new-mobile-first-website-globally-with-less-words-more-images/",
      },
    ],
  },
  {
    role: "Sr. Software Engineer at Qplay, Inc.",
    links: [
      {
        label: "Qplay launch",
        url: "https://finance.yahoo.com/news/official-tivo-co-founders-start-160054697.html",
      },
    ],
  },
  {
    role: "Sr. Software Engineer at PayPal",
    links: [
      {
        label: "Release the Kraken: PayPal, Node.js, and Lean UX",
        url: "https://nearform.com/insights/release-the-kraken-how-paypal-is-being-revolutionised-by-node-js-and-lean-ux/",
      },
    ],
  },
  {
    role: "Software Engineer at State Farm Insurance",
    links: [
      {
        label: "State Farm mobile web",
        url: "https://www.retaildive.com/ex/mobilecommercedaily/state-farm-boasts-mobile-web-as-preferred-touch-point-for-consumers",
      },
    ],
  },
] as const;

function expectPublicEvidence() {
  for (const { role, links } of roleEvidence) {
    const evidence = screen.getByRole("list", { name: `Public evidence for ${role}` });

    for (const { label, url } of links) {
      const link = within(evidence).getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  }
}

describe("work evidence", () => {
  it("shows a company logo beside every resume role", () => {
    render(<ResumeView />);
    const roleRows = Array.from(
      screen.getByRole("heading", { name: "Experience" }).nextElementSibling?.children ?? [],
    );
    const companyLogos: Record<string, string> = {
      Rocket: "/work/rocket.png",
      eBay: "/work/ebay.png",
      PayPal: "/work/paypal.png",
      "Qplay, Inc.": "/work/qplay.png",
      "State Farm Insurance": "/work/statefarm.png",
    };

    expect(roleRows).toHaveLength(resumeRoles.length);
    for (const [index, role] of resumeRoles.entries()) {
      const image = roleRows[index]?.querySelector("img");
      expect(decodeURIComponent(image?.getAttribute("src") ?? "")).toContain(
        companyLogos[role.company],
      );
      expect(image).toHaveAttribute("alt", "");
    }
  });

  it("keeps safe public receipts attached to their roles in both resume views", async () => {
    const user = userEvent.setup();
    render(<ResumeView />);

    expectPublicEvidence();

    await user.click(screen.getByRole("button", { name: "Long" }));

    expectPublicEvidence();
  });
});
