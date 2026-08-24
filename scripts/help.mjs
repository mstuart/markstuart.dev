#!/usr/bin/env node

console.log(`markstuart.dev commands

  npm run dev       Start the development server.
  npm test          Run the test suite once.
  npm run coverage  Run tests and enforce coverage thresholds.
  npm run lint      Run ESLint with zero warnings allowed.
  npm run typecheck Generate Next route types and run TypeScript.
  npm run policy    Reject forbidden tracked repository artifacts.
  npm run runtime   Verify the exact Node and npm toolchain.
  npm run build     Create a production Next.js build.
  npm run smoke     Start the build with next start and probe 200/404 routes.
  npm run check     Run the complete local and CI quality gate.
`);
