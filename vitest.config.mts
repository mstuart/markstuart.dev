import { fileURLToPath } from "node:url";
import { defineConfig, type ViteUserConfig } from "vitest/config";

const esbuildOptions: Exclude<ViteUserConfig["esbuild"], false | undefined> & {
  jsx: "automatic";
} = {
  jsx: "automatic",
};

export default defineConfig({
  oxc: false,
  esbuild: esbuildOptions,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "scripts/**/*.mjs"],
      exclude: ["app/**/opengraph-image.tsx", "app/apple-icon.tsx"],
      reporter: ["text", "json-summary", "lcov"],
      thresholds: {
        statements: 50,
        branches: 45,
        functions: 45,
        lines: 50,
      },
    },
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
