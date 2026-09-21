import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const entry = fileURLToPath(new URL("../dist/index.js", import.meta.url));
const virtualId = "\0ruler-picker-size-entry";
const result = await build({
  configFile: false,
  root,
  logLevel: "silent",
  plugins: [
    {
      name: "measure-component-import",
      resolveId: (id) =>
        id === "ruler-picker-size-entry" ? virtualId : null,
      load: (id) =>
        id === virtualId
          ? `export { RulerPicker } from ${JSON.stringify(entry)};`
          : null,
    },
  ],
  build: {
    write: false,
    minify: "oxc",
    sourcemap: false,
    target: "es2022",
    rollupOptions: {
      preserveEntrySignatures: "strict",
      input: "ruler-picker-size-entry",
      external: ["react", "react/jsx-runtime"],
      output: { format: "es" },
    },
  },
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap(
  (item) => item.output,
);
const javascript = outputs
  .filter((item) => item.type === "chunk")
  .map((item) => item.code)
  .join("\n");
if (!javascript || !javascript.includes("RulerPicker"))
  throw new Error(
    "Size entry was eliminated; refusing to report an empty bundle.",
  );
// Includes tactile-motion and both wheel backends (native compatibility + engine); React is external.
if (gzipSync(javascript, { level: 9 }).length > 8000)
  throw new Error("RulerPicker exceeds the 8 kB gzip budget.");
const pkg = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const [tarball] = JSON.parse(
  execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: root,
    encoding: "utf8",
  }),
);
const measurement = {
  version: pkg.version,
  component: {
    minified: Buffer.byteLength(javascript),
    gzip: gzipSync(javascript, { level: 9 }).length,
  },
  package: { gzip: tarball.size, unpacked: tarball.unpackedSize },
  sourceMap: tarball.files.some((file) => file.path.endsWith(".map")),
  method:
    "Vite production build; RulerPicker export only; React and react/jsx-runtime external; gzip level 9; decimal kB.",
};
// Verify sideEffects:false keeps unused imports out of a consuming app.
const unused = await build({
  configFile: false,
  root,
  logLevel: "silent",
  plugins: [
    {
      name: "unused-import",
      resolveId: (id) => (id === "unused-entry" ? "\0unused-entry" : null),
      load: (id) =>
        id === "\0unused-entry"
          ? `import { RulerPicker } from ${JSON.stringify(entry)}; export const sentinel = 1;`
          : null,
    },
  ],
  build: {
    write: false,
    minify: "oxc",
    target: "es2022",
    rollupOptions: {
      preserveEntrySignatures: "strict",
      input: "unused-entry",
      external: ["react", "react/jsx-runtime"],
      output: { format: "es" },
    },
  },
});
const unusedCode = (Array.isArray(unused) ? unused : [unused])
  .flatMap((item) => item.output)
  .filter((item) => item.type === "chunk")
  .map((item) => item.code)
  .join("\n");
if (
  !unusedCode.includes("sentinel") ||
  unusedCode.includes("rrp-") ||
  unusedCode.length > 100
)
  throw new Error("Unused component import did not tree shake.");
measurement.unusedImportBytes = Buffer.byteLength(unusedCode);
await writeFile(
  new URL("../examples/playground/size.json", import.meta.url),
  JSON.stringify(measurement, null, 2) + "\n",
);
console.log(JSON.stringify(measurement, null, 2));
