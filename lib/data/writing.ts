import type { WritingEntry } from "@/lib/types";
import type { WritingTheme } from "@/lib/posts";

export const WRITING_THEMES = [
  "Developer platforms & SDKs",
  "APIs & GraphQL",
  "AI-enabled engineering",
] as const satisfies readonly WritingTheme[];

export type ThemedWritingEntry = WritingEntry & { theme?: WritingTheme };

export const writing: ThemedWritingEntry[] = [
  {
    title: "The new era of static analysis: AI-authored, deterministically enforced",
    date: "2026-05-19",
    url: "https://careers.rocket.com/blog/technology-and-product/ai-authored-static-analysis-code-enforcement",
    source: "Rocket Technology Blog",
    theme: "AI-enabled engineering",
  },
  {
    title: "Scaling GraphQL at PayPal",
    date: "2019-10-30",
    url: "https://medium.com/paypal-tech/scaling-graphql-at-paypal-b5b5ac098810",
    source: "PayPal Technology Blog",
    views: 34000,
    theme: "APIs & GraphQL",
  },
  {
    title: "GraphQL: Instrumenting your API and unlocking superpowers",
    date: "2019-03-13",
    url: "https://medium.com/paypal-tech/graphql-instrumenting-your-api-and-unlocking-superpowers-c0bc3a9dc451",
    source: "PayPal Technology Blog",
    views: 11600,
    theme: "APIs & GraphQL",
  },
  {
    title: "GraphQL Resolvers: Best Practices",
    date: "2018-12-11",
    url: "https://medium.com/paypal-tech/graphql-resolvers-best-practices-cd36fdbcef55",
    source: "PayPal Technology Blog",
    views: 269000,
    theme: "APIs & GraphQL",
  },
  {
    title: "GraphQL: A Success Story for PayPal Checkout",
    date: "2018-10-16",
    url: "https://medium.com/paypal-tech/graphql-a-success-story-for-paypal-checkout-3482f724fb53",
    source: "PayPal Technology Blog",
    views: 96000,
    theme: "APIs & GraphQL",
  },
  {
    title: "Securing your JS apps w/ Stateless CSRF",
    date: "2016-06-01",
    url: "https://medium.com/paypal-engineering/securing-your-js-apps-w-stateless-csrf-9a60ee6bd010",
    source: "PayPal Technology Blog",
    views: 6700,
    theme: "APIs & GraphQL",
  },
];
