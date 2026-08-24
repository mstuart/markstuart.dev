export type ProjectCaseStudySlug = "peek" | "tare" | "graphql-agent-toolkit";

export interface ProjectCaseStudyLink {
  label: "GitHub" | "Install" | "Documentation";
  href: string;
}

export interface ProjectCaseStudyApproach {
  title: string;
  body: string;
}

export interface ProjectCaseStudyProof {
  title: string;
  detail: string;
  sourceLabel: string;
  sourceHref: string;
}

export interface ProjectCaseStudy {
  slug: ProjectCaseStudySlug;
  title: string;
  description: string;
  summary: string;
  problem: readonly string[];
  whyExistingApproachesFallShort: readonly string[];
  approach: readonly ProjectCaseStudyApproach[];
  proof: readonly ProjectCaseStudyProof[];
  tradeoffs: readonly string[];
  lessons: readonly string[];
  links: readonly ProjectCaseStudyLink[];
}

export const projectCaseStudies = [
  {
    slug: "peek",
    title: "peek",
    description:
      "DevTools for understanding coding-agent sessions across Claude Code, Codex, and pi.",
    summary:
      "peek turns the session logs coding agents already write into historical analysis of context, cost, compactions, and configuration changes.",
    problem: [
      "Coding agents record a large amount of session data, but the raw logs do not readily explain where context went, what a session cost, when compaction changed the working set, or whether a configuration change helped.",
      "Those questions become harder when work spans multiple harnesses with different log formats and usage fields.",
    ],
    whyExistingApproachesFallShort: [
      "Native context and usage views are useful during a live session, not for cross-harness historical analysis after it ends.",
      "ccusage already provides cross-harness totals, while Claude-focused visual tools provide deeper views for one harness. Neither combines historical composition, compaction analysis, attribution depth, whole-session diffs, and CLI or JSON output across all three supported harnesses.",
    ],
    approach: [
      {
        title: "Read the source of record",
        body: "Harness adapters read existing local session logs. Exact totals come from each harness's recorded usage fields, while estimated composition is visibly marked and any unlogged residual is named.",
      },
      {
        title: "Normalize analysis across harnesses",
        body: "A shared command surface exposes session inventory, context composition, cost attribution, compaction timelines, diffs, and self-contained HTML reports for Claude Code, Codex, and pi.",
      },
      {
        title: "Test configuration changes with real runs",
        body: "peek bench runs a trusted task suite under two configurations in isolated git worktrees, executes the suite's verification command, then compares the resulting session logs with the same accounting model.",
      },
    ],
    proof: [
      {
        title: "Accounting reconciliation",
        detail:
          "The published comparison reports a 0.00% delta against ccusage for every token class and cost at matched scope.",
        sourceLabel: "Design notes",
        sourceHref: "https://github.com/mstuart/peek/blob/main/docs/DESIGN.md",
      },
      {
        title: "Point-in-time corpus coverage",
        detail:
          "The public README records 2,000 real Claude Code sessions, 67,458 turns, and zero parse failures in its committed integration test run.",
        sourceLabel: "Public proof table",
        sourceHref: "https://github.com/mstuart/peek#proof",
      },
      {
        title: "Measured cache and A/B results",
        detail:
          "The published runs show peek list improving from 6.18 seconds cold to 0.21 seconds warm, and a passing model A/B trial using 19.1% fewer tokens and costing 93.4% less for 1.1 seconds more wall time.",
        sourceLabel: "Public proof table",
        sourceHref: "https://github.com/mstuart/peek#proof",
      },
    ],
    tradeoffs: [
      "peek is deliberately historical. It does not replace a harness's live context or usage display.",
      "Exact totals do not make every composition category exact. Estimates stay marked, and the Codex composition analysis currently reports a 67.4% residual.",
      "Bench trials call real agents, can cost money, and use worktrees for isolation rather than as a security boundary.",
    ],
    lessons: [
      "Observability is more trustworthy when exact values, estimates, and unknown residuals are kept distinct.",
      "Publishing a refuted near-exact composition hypothesis was more useful than preserving a stronger but unsupported claim.",
      "The same accounting path should power both everyday inspection and experiments so benchmark conclusions remain auditable.",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/mstuart/peek" },
      { label: "Install", href: "https://www.npmjs.com/package/@mstuart/peek" },
      { label: "Documentation", href: "https://github.com/mstuart/peek/tree/main/docs" },
    ],
  },
  {
    slug: "tare",
    title: "tare",
    description:
      "Local, cache-aware context compression for coding agents, lossless by default.",
    summary:
      "tare compresses agent context through a proxy, CLI, MCP server, and language libraries while protecting provider prefix caches and watching total token behavior.",
    problem: [
      "Coding agents accumulate tool output, logs, file reads, JSON, and history until the context window becomes expensive or full.",
      "Removing input tokens is not enough by itself: rewriting a cached prefix can forfeit a provider discount, and aggressive compression can make a model answer more verbosely.",
    ],
    whyExistingApproachesFallShort: [
      "Most compressors optimize input tokens in one direction without observing cache-hit rate or the output tokens that follow.",
      "Provider-native compaction is tied to one provider, command-output wrappers cover a narrower slice of context, and model-based prose compressors add weights and inference latency while remaining lossy.",
    ],
    approach: [
      {
        title: "Preserve information by default",
        body: "The default pipeline uses reversible transforms such as columnar encoding, deduplication, cross-turn deltas, and schema slimming. Row caps, field truncation, telegraphic prose, and AST code skeletonization are opt-in.",
      },
      {
        title: "Protect the cache boundary",
        body: "The local proxy detects the provider cache breakpoint and compresses only the dynamic suffix, keeping the stable prefix byte-for-byte intact.",
      },
      {
        title: "Close the feedback loop",
        body: "A per-session controller halts when cache-hit rate suffers, backs off when output verbosity spikes, and compresses harder as context fill rises. The same engine is exposed through Rust, Python, JavaScript, the CLI, and MCP.",
      },
    ],
    proof: [
      {
        title: "Agent context",
        detail:
          "On the committed corpus, tare compress reduced agent_context from 15,130 to 8,499 o200k_base tokens, a 43.8% reduction.",
        sourceLabel: "Benchmark methodology and results",
        sourceHref: "https://github.com/mstuart/tare/blob/main/docs/benchmarks.md",
      },
      {
        title: "Application logs",
        detail:
          "The opt-in compact-lossy command reduced app_log from 13,217 to 6,551 tokens, a 50.4% reduction on the committed corpus.",
        sourceLabel: "Benchmark methodology and results",
        sourceHref: "https://github.com/mstuart/tare/blob/main/docs/benchmarks.md",
      },
      {
        title: "Code skeletonization",
        detail:
          "The opt-in skeletonize command reduced server_rs from 5,930 to 1,582 tokens, a 73.3% reduction while retaining code structure.",
        sourceLabel: "Benchmark methodology and results",
        sourceHref: "https://github.com/mstuart/tare/blob/main/docs/benchmarks.md",
      },
    ],
    tradeoffs: [
      "Proxy and CLI token counts use an approximate chars-per-four model; the published benchmark table uses tiktoken o200k_base instead.",
      "The proxy handles credentials and should run as a trusted local sidecar, not as shared multi-tenant infrastructure.",
      "The public benchmark notes live Anthropic smoke tests, but also says tare is not yet production-hardened or load-tested.",
    ],
    lessons: [
      "Context optimization has to account for cache economics, not only raw prompt size.",
      "Net tokens matter more than input tokens removed when compression can change the model's response behavior.",
      "A conservative default and explicit lossy controls make compression easier to reason about and reverse.",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/mstuart/tare" },
      { label: "Install", href: "https://www.npmjs.com/package/tare-ai" },
      { label: "Documentation", href: "https://github.com/mstuart/tare/tree/main/docs" },
    ],
  },
  {
    slug: "graphql-agent-toolkit",
    title: "graphql-agent-toolkit",
    description:
      "A TypeScript toolkit that turns GraphQL APIs into MCP servers and agent-ready tools.",
    summary:
      "graphql-agent-toolkit introspects a GraphQL endpoint, builds typed operations, and exposes them to agents through MCP or framework-native adapters.",
    problem: [
      "A GraphQL schema contains the information needed to call an API, but an agent still needs discoverable tool definitions, valid operations and variables, pagination handling, and responses sized for its context window.",
      "Building that bridge separately for every endpoint repeats the same schema, execution, and framework integration work.",
    ],
    whyExistingApproachesFallShort: [
      "Giving an agent a raw schema leaves it to search a potentially broad type graph and construct correct nested operations on every call.",
      "Handwritten wrappers duplicate endpoint-specific plumbing, while returning full paginated responses can consume context that should remain available for the task.",
    ],
    approach: [
      {
        title: "Derive tools from the schema",
        body: "The toolkit fetches and parses introspection, generates operations with variable definitions and bounded selection depth, and creates one MCP tool for each query and mutation plus an explore_schema tool.",
      },
      {
        title: "Keep discovery and results agent-sized",
        body: "A TF-IDF schema navigator finds relevant types and fields. Pagination helpers recognize Relay and offset styles, while summarization limits arrays, depth, and string length before formatting results for an LLM.",
      },
      {
        title: "Separate the core from frameworks",
        body: "The same parsed schema and executor feed MCP, LangChain, CrewAI, and Vercel AI SDK adapters without requiring those frameworks in the core package. Deterministic mock generation supports local testing.",
      },
    ],
    proof: [
      {
        title: "Runnable endpoint workflow",
        detail:
          "The public README documents npx commands that introspect an endpoint with init and serve the generated MCP surface with serve.",
        sourceLabel: "Quick start",
        sourceHref: "https://github.com/mstuart/graphql-agent-toolkit#quick-start",
      },
      {
        title: "Schema-derived MCP surface",
        detail:
          "Each query is exposed as query_<fieldName>, each mutation as mutate_<fieldName>, and explore_schema gives agents a way to browse types and fields.",
        sourceLabel: "MCP server example",
        sourceHref: "https://github.com/mstuart/graphql-agent-toolkit#create-an-mcp-server",
      },
      {
        title: "Documented integration surface",
        detail:
          "The published API covers introspection, operation building, semantic navigation, Relay and offset pagination, response summarization, LangChain, CrewAI, Vercel AI SDK, and deterministic mocks.",
        sourceLabel: "API reference",
        sourceHref: "https://github.com/mstuart/graphql-agent-toolkit#api-reference",
      },
    ],
    tradeoffs: [
      "Generated selection sets use a configurable depth rather than inferring the ideal business-specific shape for every task.",
      "Response summarization intentionally truncates data to protect the context window, so callers must choose limits that fit their task.",
      "The package requires Node.js 22 or newer and graphql 16 or newer. The public README does not publish performance or adoption benchmarks.",
    ],
    lessons: [
      "GraphQL introspection is most useful to an agent when it becomes a searchable, constrained tool surface instead of a schema dump.",
      "A framework-neutral core keeps transport and agent-framework choices from leaking into operation generation.",
      "Context management belongs near execution because even a valid API response can be too large to be useful to an agent.",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/mstuart/graphql-agent-toolkit" },
      { label: "Install", href: "https://www.npmjs.com/package/graphql-agent-toolkit" },
      {
        label: "Documentation",
        href: "https://github.com/mstuart/graphql-agent-toolkit#api-reference",
      },
    ],
  },
] as const satisfies readonly ProjectCaseStudy[];

export function getProjectCaseStudy(slug: string): ProjectCaseStudy | undefined {
  return projectCaseStudies.find((study) => study.slug === slug);
}
