import { defineConfig } from "vite";

export default defineConfig({
  // Classic JSX keeps React external in both module formats.
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
      external: ["react", "react/jsx-runtime", "tactile-motion"],
      output: { banner: "'use client';" },
    },
  },
});
