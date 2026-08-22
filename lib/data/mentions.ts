import type { Mention } from "@/lib/types";

export const mentions: Mention[] = [
  {
    kind: "press",
    title: "PayPal + Apollo GraphQL customer case study",
    description:
      "Apollo's official PayPal case study quotes Mark, credited as Sr. Manager of Web Platform, on GraphQL's impact on Checkout.",
    url: "https://www.apollographql.com/customers/paypal",
    iconSrc: "/press/apollo.png",
  },
  {
    kind: "press",
    title: "My first 6 months at Apollo GraphQL",
    date: "2022-01-25",
    description:
      "Apollo blog post by George Snowflack quotes Mark, credited as Director of Engineering at PayPal, on UI developers' time spent building UI.",
    url: "https://www.apollographql.com/blog/my-first-6-months-at-apollo-graphql",
    iconSrc: "/press/apollo.png",
  },
  {
    kind: "book",
    title: "Federated GraphQL on .NET, Chapter 1: Where the Single Schema Cracks",
    date: "2026-08",
    description:
      "In-progress technical book manuscript quotes Mark by name from Scaling GraphQL at PayPal, with a formal bibliography entry.",
    url: "https://github.com/Giang-Dang/latex-books/blob/main/books/federated-graphql-on-dotnet/chapters/01-why-one-graph-is-never-enough/02-where-the-single-schema-cracks.tex",
    iconSrc: "/press/dotnet-book.png",
  },
  {
    kind: "book",
    title: "Production Ready GraphQL, expert interview",
    date: "2020",
    description:
      "One of four text-based expert interviews included in the book's Complete Package, alongside engineers working with GraphQL at Shopify, GitHub, and more.",
    url: "https://book.productionreadygraphql.com/",
    iconSrc: "/press/prg.png",
  },
  {
    kind: "newsletter",
    title: "GraphQL Weekly, Issue 116",
    date: "2018-10-19",
    description:
      "Featured \"GraphQL: A Success Story for PayPal Checkout\" as a kickoff to further PayPal GraphQL pieces.",
    url: "https://graphqlweekly.com/issues/116",
    iconSrc: "/press/graphqlweekly.png",
  },
  {
    kind: "newsletter",
    title: "GraphQL Weekly, Issue 124",
    date: "2018-12-13",
    description:
      "Featured \"GraphQL Resolvers: Best Practices\" as a well-written summary of effective resolver practices.",
    url: "https://graphqlweekly.com/issues/124",
    iconSrc: "/press/graphqlweekly.png",
  },
  {
    kind: "newsletter",
    title: "GraphQL Weekly, Issue 167",
    date: "2019-11-01",
    description:
      "Featured \"Scaling GraphQL at PayPal,\" covering the adoption, tooling, and journey from REST to Batch REST to GraphQL.",
    url: "https://graphqlweekly.com/issues/167",
    iconSrc: "/press/graphqlweekly.png",
  },
  {
    kind: "newsletter",
    title: "GraphQL Weekly, Issue 194",
    date: "2020-07-17",
    description:
      "Events section listed Mark as a speaker at GraphQL Enterprise Connect 2020, an online meetup with This Dot Labs, PayPal, and Braintree.",
    url: "https://graphqlweekly.com/issues/194",
    iconSrc: "/press/graphqlweekly.png",
  },
  {
    kind: "education",
    title: "Universidad de La Laguna, Master's in Web Systems and Services, GraphQL server practicum",
    date: "2023-2024",
    description:
      "Course materials list GraphQL Resolvers: Best Practices as assigned reading for the GraphQL server practicum.",
    url: "https://github.com/ULL-MII-SYTWS/vuepress-apuntes/blob/main/docs/cursos/sytws/2023-2024/practicas/graphql-server.md",
    iconSrc: "/press/ull.png",
  },
  {
    kind: "education",
    title: "36 GraphQL Concepts Every Developer Should Know (Novvum)",
    date: "2019-08",
    description:
      "Curated GraphQL learning resource credits GraphQL Resolvers: Best Practices in its Building the Server section.",
    url: "https://github.com/Novvum/36-graphql-concepts",
    iconSrc: "/press/novvum.png",
  },
  {
    kind: "education",
    title: "A Walk in GraphQL, Day 2 lesson",
    date: "2020-08",
    description:
      "GraphQL course repo's Day 2 lesson on resolvers links Mark by name alongside the Resolvers Best Practices post.",
    url: "https://github.com/thinkb4/a-walk-in-graphql/blob/develop/lessons/day_02/day_02.md",
    iconSrc: "/press/thinkb4.png",
  },
  {
    kind: "education",
    title: "dev-journey-data, GraphQL learning-path dataset",
    date: "2023-10",
    description:
      "Structured JSON learning-resource dataset lists the Resolvers Best Practices post with Mark as the author.",
    url: "https://github.com/andrewvo89/dev-journey-data/blob/main/language/graphql.json",
    iconSrc: "/press/devjourney.png",
  },
  {
    kind: "community",
    title: "graphql-lazyloader README",
    date: "2021-02",
    description:
      "Maintainer's README credits the Resolvers Best Practices post with reshaping the package's design.",
    url: "https://github.com/gajus/graphql-lazyloader",
    iconSrc: "/press/gajus.png",
  },
  {
    kind: "community",
    title: "GraphQL at PayPal: An Adoption Story",
    date: "2021-08-31",
    description:
      "PayPal Tech blog post by Shruti Kapoor thanks Mark for leading GraphQL adoption at PayPal and credits him as an interview source.",
    url: "https://medium.com/paypal-tech/graphql-at-paypal-an-adoption-story-b7e01175f2b7",
    iconSrc: "/press/paypal.png",
  },
  {
    kind: "community",
    title: "HTML5DevConf 2014 attendee notes (whastings/devnotes)",
    date: "2014-05",
    description:
      "Personal conference notes summarize Mark's HTML5DevConf talk and praise krakenjs conventions.",
    url: "https://github.com/whastings/devnotes/blob/master/conferences/html5_dev_conf_may_2014.md",
    iconSrc: "/press/whastings.png",
  },
  {
    kind: "community",
    title: "graphql.org, \"Who's Using GraphQL\" page",
    date: "2018-06-29",
    description:
      "PayPal added to graphql.org's community adoption page via PR #518; Mark was cc'd as PayPal's GraphQL contact.",
    url: "https://github.com/graphql/graphql.github.io/pull/518",
    iconSrc: "/press/graphql.png",
  },
  {
    kind: "community",
    title: "Discussed on Hacker News",
    description:
      "Three of Mark's PayPal GraphQL posts were submitted to Hacker News independently, each with modest engagement.",
    url: "https://news.ycombinator.com/item?id=21420027",
    iconSrc: "/press/hn.svg",
    urls: [
      "https://news.ycombinator.com/item?id=21420027",
      "https://news.ycombinator.com/item?id=20627481",
      "https://news.ycombinator.com/item?id=18311741",
    ],
  },
];
