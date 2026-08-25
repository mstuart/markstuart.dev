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
    ],
  },
  {
    role: "Distinguished Engineer at eBay",
    links: [{ label: "eBay Live", url: "https://www.ebay.com/ebaylive" }],
  },
  {
    role: "Sr. Principal Engineer at PayPal",
    links: [
      {
        label: "PayPal Checkout components on GitHub",
        url: "https://github.com/paypal/paypal-checkout-components",
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
