import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ResumeView } from "@/components/resume-view";

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
  it("keeps safe public receipts attached to their roles in both resume views", async () => {
    const user = userEvent.setup();
    render(<ResumeView />);

    expectPublicEvidence();

    await user.click(screen.getByRole("button", { name: "Long" }));

    expectPublicEvidence();
  });
});
