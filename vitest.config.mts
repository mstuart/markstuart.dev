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
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
