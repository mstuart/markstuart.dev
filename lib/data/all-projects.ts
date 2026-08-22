// Complete list of Mark's PUBLIC source (non-fork) repositories on GitHub.
// Generated from `gh repo list mstuart --source --visibility public` on
// 2026-08-20; sorted by most recent push. Private repositories are
// deliberately excluded. Regenerate via the same command when refreshing.

export interface RepoIndexEntry {
  name: string;
  description?: string;
  url?: string;
  stars: number;
  archived?: boolean;
  /** Phosphor icon component name shown next to the repo in the all-repositories list. */
  icon?: string;
  /** ISO date the repository was created on GitHub (render as year). */
  createdAt?: string;
  /** Grouping used by the all-repositories tag filter, mirroring the GitHub profile README sections. */
  tag: string;
}

export const allRepos: RepoIndexEntry[] = [
  { name: "code-memory", description: "Persistent memory for AI coding - semantic search, git history, and intelligent context preservation", url: "https://github.com/mstuart/code-memory", stars: 0, icon: "Database", createdAt: "2026-02-16", tag: "AI & Agents" },
  { name: "mcp-prune", description: "Audit MCP server usage from Claude Code transcripts. Find idle servers to prune.", url: "https://github.com/mstuart/mcp-prune", stars: 0, icon: "PlugsConnected", createdAt: "2026-05-21", tag: "AI & Agents" },
  { name: "ai-statusline", description: "Customizable status line for AI coding assistants - real-time display of model, tokens, cost, git status, and more", url: "https://github.com/mstuart/ai-statusline", stars: 0, icon: "Package", createdAt: "2026-02-16", tag: "AI & Agents" },
  { name: "tare", description: "Lossless-by-default context compression for LLM coding agents - proxy, library, CLI, and MCP server. Local-first, cache-correct, reversible.", url: "https://github.com/mstuart/tare", stars: 1, icon: "PlugsConnected", createdAt: "2026-06-22", tag: "AI & Agents" },
  { name: "graphql-workshop", description: "⚡GraphQL Workshop @ Venmo -- Fall 2018 🏎️", url: "https://github.com/mstuart/graphql-workshop", stars: 5, icon: "Graph", createdAt: "2018-10-09", tag: "GraphQL" },
  { name: "versionkit", description: "Framework-agnostic API versioning with RFC 8594 Sunset and RFC 9745 Deprecation headers", url: "https://github.com/mstuart/versionkit", stars: 0, icon: "Cloud", createdAt: "2026-02-21", tag: "HTTP & APIs" },
  { name: "vitals", description: "Local-first archive and baseline-deviation detector for Google Health API v4 (Fitbit, Pixel Watch) data", url: "https://github.com/mstuart/vitals", stars: 1, icon: "Cloud", createdAt: "2026-08-06", tag: "AI & Agents" },
  { name: "openapi-sentinel", description: "Runtime OpenAPI 3.1 request/response validation middleware - detect spec drift live", url: "https://github.com/mstuart/openapi-sentinel", stars: 0, icon: "ShieldCheck", createdAt: "2026-02-21", tag: "HTTP & APIs" },
  { name: "graphql-operation-store", description: "Framework-agnostic persisted query and trusted document store for GraphQL", url: "https://github.com/mstuart/graphql-operation-store", stars: 0, icon: "Graph", createdAt: "2026-02-21", tag: "GraphQL" },
  { name: "fetch-resilience", description: "Composable resilience policies (retry, timeout, circuit breaker, bulkhead) for native fetch - edge-safe, zero dependencies", url: "https://github.com/mstuart/fetch-resilience", stars: 0, icon: "Cloud", createdAt: "2026-02-21", tag: "HTTP & APIs" },
  { name: "graphql-contract", description: "Consumer-driven contract testing for GraphQL APIs - no Pact Broker required", url: "https://github.com/mstuart/graphql-contract", stars: 0, icon: "Graph", createdAt: "2026-02-21", tag: "GraphQL" },
  { name: "graphql-schema-policies", description: "Semantic GraphQL schema design policy enforcement for CI pipelines", url: "https://github.com/mstuart/graphql-schema-policies", stars: 0, icon: "Graph", createdAt: "2026-02-21", tag: "GraphQL" },
  { name: "mcp-replay", description: "Record and replay MCP server interactions for deterministic CI testing - nock/msw for MCP", url: "https://github.com/mstuart/mcp-replay", stars: 0, icon: "PlugsConnected", createdAt: "2026-02-21", tag: "AI & Agents" },
  { name: "mcp-tool-lint", description: "Static linter for MCP tool definitions - catch quality defects before deployment", url: "https://github.com/mstuart/mcp-tool-lint", stars: 0, icon: "PlugsConnected", createdAt: "2026-02-21", tag: "AI & Agents" },
  { name: "peek", description: "DevTools for coding agents - session composition, cost attribution, compaction forensics, and config A/B benchmarking across Claude Code, Codex, and pi", url: "https://github.com/mstuart/peek", stars: 0, icon: "Gauge", createdAt: "2026-08-09", tag: "AI & Agents" },
  { name: "graphql-cost-guardian", description: "Analyze and limit the cost of GraphQL queries using configurable field costs", url: "https://github.com/mstuart/graphql-cost-guardian", stars: 0, icon: "Graph", createdAt: "2026-02-16", tag: "GraphQL" },
  { name: "iterable-ops", description: "Lazy utility functions for sync and async iterables - map, filter, take, chunk, zip, flatten", url: "https://github.com/mstuart/iterable-ops", stars: 0, icon: "Waveform", createdAt: "2026-02-16", tag: "Data & Errors" },
  { name: "memcheck-node", description: "Automated memory leak regression testing for Node.js", url: "https://github.com/mstuart/memcheck-node", stars: 0, icon: "Gauge", createdAt: "2026-02-16", tag: "Performance" },
  { name: "map-extras", description: "Utility functions for JavaScript Map - mapValues, filterEntries, merge, invert, and groupBy", url: "https://github.com/mstuart/map-extras", stars: 0, icon: "Terminal", createdAt: "2026-02-16", tag: "Data & Errors" },
  { name: "error-with-cause", description: "Create typed error classes with error codes, cause chains, and type guards", url: "https://github.com/mstuart/error-with-cause", stars: 0, icon: "Bug", createdAt: "2026-02-16", tag: "Data & Errors" },
  { name: "api-perf-budget", description: "Define and enforce per-route latency budgets for Node.js APIs in CI", url: "https://github.com/mstuart/api-perf-budget", stars: 0, icon: "Gauge", createdAt: "2026-02-16", tag: "HTTP & APIs" },
  { name: "context-local", description: "Ergonomic typed context for async flows using AsyncLocalStorage", url: "https://github.com/mstuart/context-local", stars: 0, icon: "Package", createdAt: "2026-02-16", tag: "Async & Runtime" },
  { name: "graphql-pluck-types", description: "Extract TypeScript interface definitions from a GraphQL schema SDL string", url: "https://github.com/mstuart/graphql-pluck-types", stars: 0, icon: "Graph", createdAt: "2026-02-16", tag: "GraphQL" },
  { name: "disposable-from", description: "Create Disposable wrappers for timers, event listeners, intervals, and custom cleanup", url: "https://github.com/mstuart/disposable-from", stars: 0, icon: "Package", createdAt: "2026-02-16", tag: "Async & Runtime" },
  { name: "using-safe", description: "Safely use and dispose resources, even without the using declaration", url: "https://github.com/mstuart/using-safe", stars: 0, icon: "Package", createdAt: "2026-02-16", tag: "Async & Runtime" },
  { name: "deep-diff-patch", description: "Compute a minimal JSON-serializable diff between objects and apply it as a patch", url: "https://github.com/mstuart/deep-diff-patch", stars: 0, icon: "Bug", createdAt: "2026-02-16", tag: "Data & Errors" },
  { name: "schema-guard", description: "Create lightweight runtime type guards from a plain object schema", url: "https://github.com/mstuart/schema-guard", stars: 0, icon: "Package", createdAt: "2026-02-16", tag: "Data & Errors" },
  { name: "dep-perf-analyzer", description: "Measure the runtime performance impact of npm dependencies", url: "https://github.com/mstuart/dep-perf-analyzer", stars: 0, icon: "Gauge", createdAt: "2026-02-16", tag: "Performance" },
  { name: "web-stream-transform", description: "Functional transform helpers for Web Streams - map, filter, take, batch, and tap", url: "https://github.com/mstuart/web-stream-transform", stars: 0, icon: "Waveform", createdAt: "2026-02-16", tag: "Data & Errors" },
  { name: "weakref-store", description: "A WeakRef-based cache that automatically evicts entries when values are garbage collected", url: "https://github.com/mstuart/weakref-store", stars: 0, icon: "Database", createdAt: "2026-02-16", tag: "Performance" },
  { name: "abort-race", description: "Race multiple async operations with automatic AbortSignal cleanup for losers", url: "https://github.com/mstuart/abort-race", stars: 0, icon: "Waveform", createdAt: "2026-02-16", tag: "Async & Runtime" },
  { name: "problem-response", description: "RFC 9457 Problem Details for HTTP APIs - framework-agnostic, TypeScript-first error responses", url: "https://github.com/mstuart/problem-response", stars: 0, icon: "Cloud", createdAt: "2026-02-16", tag: "HTTP & APIs" },
  { name: "offload-fn", description: "Run a function in a Worker thread and get back a promise", url: "https://github.com/mstuart/offload-fn", stars: 0, icon: "Package", createdAt: "2026-02-16", tag: "Async & Runtime" },
  { name: "abort-timer", description: "Create an AbortSignal that aborts after a timeout, with reset and clear", url: "https://github.com/mstuart/abort-timer", stars: 0, icon: "Waveform", createdAt: "2026-02-16", tag: "Async & Runtime" },
  { name: "error-serialize", description: "Serialize and deserialize Error objects to plain objects, preserving cause chains", url: "https://github.com/mstuart/error-serialize", stars: 0, icon: "Bug", createdAt: "2026-02-16", tag: "Data & Errors" },
  { name: "portacache", description: "Portable key-value cache that auto-selects the best storage backend", url: "https://github.com/mstuart/portacache", stars: 0, icon: "Database", createdAt: "2026-02-16", tag: "Performance" },
  { name: "set-extras", description: "Set algebra operations - union, intersection, difference, symmetric difference, subset, superset", url: "https://github.com/mstuart/set-extras", stars: 0, icon: "Bug", createdAt: "2026-02-16", tag: "Data & Errors" },
  { name: "stream-to-value", description: "Consume a Web ReadableStream into a string, Uint8Array, JSON object, or array of chunks", url: "https://github.com/mstuart/stream-to-value", stars: 0, icon: "Waveform", createdAt: "2026-02-16", tag: "Data & Errors" },
  { name: "signal-compose", description: "Compose multiple AbortSignals with AND, OR, and timeout semantics", url: "https://github.com/mstuart/signal-compose", stars: 0, icon: "Waveform", createdAt: "2026-02-16", tag: "Async & Runtime" },
  { name: "has-permission", description: "Check and assert Node.js Permission Model permissions at runtime", url: "https://github.com/mstuart/has-permission", stars: 0, icon: "Package", createdAt: "2026-02-16", tag: "Async & Runtime" },
  { name: "is-runtime", description: "Detect the current JavaScript runtime environment", url: "https://github.com/mstuart/is-runtime", stars: 0, icon: "Terminal", createdAt: "2026-02-16", tag: "Async & Runtime" },
  { name: "graphql-hash", description: "Generate a deterministic hash of a GraphQL query for caching and persisted queries", url: "https://github.com/mstuart/graphql-hash", stars: 0, icon: "Graph", createdAt: "2026-02-16", tag: "GraphQL" },
  { name: "mem-pressure", description: "Monitor Node.js memory usage and emit events when thresholds are exceeded", url: "https://github.com/mstuart/mem-pressure", stars: 0, icon: "Gauge", createdAt: "2026-02-16", tag: "Performance" },
  { name: "has-disposable", description: "Check if a value implements the Disposable or AsyncDisposable protocol", url: "https://github.com/mstuart/has-disposable", stars: 0, icon: "Package", createdAt: "2026-02-16", tag: "Async & Runtime" },
  { name: "homebrew-axi", description: "AXI-compliant read-only Homebrew wrapper - token-efficient TOON output for coding agents", url: "https://github.com/mstuart/homebrew-axi", stars: 0, icon: "Package", createdAt: "2026-08-09", tag: "AI & Agents" },
  { name: "pypi-axi", description: "AXI-compliant PyPI wrapper - token-efficient TOON output for coding agents", url: "https://github.com/mstuart/pypi-axi", stars: 0, icon: "Package", createdAt: "2026-08-09", tag: "AI & Agents" },
  { name: "perf-fn", description: "Measure async and sync function execution time using the Performance API", url: "https://github.com/mstuart/perf-fn", stars: 0, icon: "Gauge", createdAt: "2026-02-16", tag: "Performance" },
  { name: "graphql-agent-toolkit", description: "Turn any GraphQL API into AI-agent-ready tools - MCP servers, LangChain tools, and standalone SDKs", url: "https://github.com/mstuart/graphql-agent-toolkit", stars: 0, icon: "Graph", createdAt: "2026-02-15", tag: "GraphQL" },
  { name: "graphql-sentinel", description: "Comprehensive GraphQL security scanner and runtime shield", url: "https://github.com/mstuart/graphql-sentinel", stars: 1, icon: "Graph", createdAt: "2026-02-15", tag: "GraphQL" },
  { name: "graphql-watchdog", description: "GraphQL performance toolkit - N+1 detection, normalized caching, cost analysis, and CI regression testing", url: "https://github.com/mstuart/graphql-watchdog", stars: 0, icon: "Graph", createdAt: "2026-02-15", tag: "GraphQL" },
  { name: "pr-babysitter", description: "AI-powered PR babysitter - automatically fixes merge conflicts, failing CI, and unresolved review comments using Claude Code", url: "https://github.com/mstuart/pr-babysitter", stars: 0, icon: "Package", createdAt: "2026-04-19", tag: "AI & Agents" },
  { name: "mstuart", url: "https://github.com/mstuart/mstuart", stars: 0, icon: "Package", createdAt: "2026-06-14", tag: "Other" },
  { name: "xoom-graphql-workshop", description: "⚡GraphQL Workshop @ Xoom -- Spring 2019 🏎️", url: "https://github.com/mstuart/xoom-graphql-workshop", stars: 1, archived: true, icon: "Graph", createdAt: "2019-05-13", tag: "GraphQL" },
];
