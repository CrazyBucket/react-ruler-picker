import { defineConfig } from "vite";

export default defineConfig({
  // Classic JSX keeps Node ESM consumers compatible with React 16.8+.
  oxc: { jsx: { runtime: "classic", pragma: "createElement" } },
  build: {
    outDir: "dist",
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    sourcemap: process.env.RULER_PICKER_SOURCEMAP === "1",
    rollupOptions: {
      external: ["react", "react/jsx-runtime"],
      output: { banner: "'use client';" },
    },
  },
});
