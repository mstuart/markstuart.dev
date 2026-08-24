import type { Attended } from "@/lib/types";

// Community participation: panels and events where Mark represented PayPal
// or took part without giving a talk of his own.
export const community: Attended[] = [
  {
    event: "JS@PayPal 2021 Online Conference",
    date: "2021-05-19",
    note: "Co-host of PayPal's public JavaScript conference, streamed live May 19 through 21 on the PayPal Developer channel.",
    url: "https://www.youtube.com/watch?v=3_73S7kOW8U",
    iconSrc: "/talks/paypal.png",
  },
  {
    event: "Hacktoberfest at PayPal",
    date: "2020-10",
    note: "Organized PayPal's Hacktoberfest program on GitHub: curated issues across the PayPal and krakenjs SDK repos, with PayPal socks for early contributors. PayPal ran it again in 2021.",
    url: "https://x.com/markstuartdev/status/1312151005652377601",
    iconSrc: "/talks/github.png",
  },
  {
    event: "GraphQL Enterprise Connect",
    date: "2020-08-14",
    note: "Community panelist, representing PayPal; online meetup co-hosted by This Dot Labs, PayPal, and Braintree. The meetup's own site is no longer live; linked via GraphQL Weekly's recap (issue 194).",
    url: "https://graphqlweekly.com/issues/194",
    iconSrc: "/talks/graphql.png",
  },
  {
    event: "GraphQL Contributor Days, Front-end Framework Edition",
    date: "2019-08-08",
    note: "Panelist, representing PayPal; online edition, This Dot Labs x Hasura.",
    url: "https://www.thisdot.co/blog/graphql-contributor-days-front-end-framework-edition-august-8th-2019/",
    iconSrc: "/talks/thisdot.png",
  },
  {
    event: "GraphQL Contributor Days, San Francisco",
    date: "2019-02-08",
    note: "Second in-person edition; represented PayPal, troubleshooting advanced GraphQL problems; This Dot Labs x Hasura.",
    url: "https://x.com/ThisDotMedia/status/1090046117541302278",
    iconSrc: "/talks/thisdot.png",
  },
  {
    event: "GraphQL Contributor Days, San Francisco",
    date: "2018-11-12",
    note: "Inaugural edition, in person; represented PayPal; This Dot Labs x Hasura.",
    url: "https://hasura.io/blog/notes-from-graphql-contributor-days-nov18",
    iconSrc: "/talks/thisdot.png",
  },
];
