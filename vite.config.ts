import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

export default defineConfig({
  base: "./",
  define: { __APP_VERSION__: JSON.stringify(version) },
  build: {
    outDir: "example-dist",
    rollupOptions: {
      input: { main: "index.html" },
    },
  },
  test: { include: ["tests/**/*.test.{ts,tsx}"] },
});
