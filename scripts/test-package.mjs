import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const consumer = createRequire(resolve(process.argv[2] ?? ".", "package.json"));
const React = consumer("react");
const { renderToStaticMarkup } = consumer("react-dom/server");
const fixture = await mkdtemp(join(tmpdir(), "ruler-picker-package-"));

try {
  const packageDir = join(fixture, "node_modules/react-ruler-picker");
  await mkdir(packageDir, { recursive: true });
  const [packed] = JSON.parse(
    execFileSync(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", fixture],
      { encoding: "utf8" },
    ),
  );
  assert.ok(packed.files.some((file) => file.path === "README.md"));
  assert.ok(
    !packed.files.some(
      (file) =>
        file.path.startsWith("examples/") || file.path.startsWith("src/"),
    ),
  );
  execFileSync("tar", [
    "-xzf",
    join(fixture, packed.filename),
    "--strip-components=1",
    "-C",
    packageDir,
  ]);
  await symlink(
    dirname(consumer.resolve("react/package.json")),
    join(fixture, "node_modules/react"),
    "dir",
  );
  await writeFile(
    join(fixture, "import.mjs"),
    "export * from 'react-ruler-picker';\n",
  );
  const require = createRequire(join(fixture, "require.cjs"));
  const modules = [
    ["CJS", require("react-ruler-picker")],
    ["ESM", await import(pathToFileURL(join(fixture, "import.mjs")).href)],
  ];
  for (const [format, { RulerPicker }] of modules) {
    const output = renderToStaticMarkup(
      React.createElement(RulerPicker, {
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 5,
      }),
    );
    assert.match(output, /rrp-root/);
    assert.match(output, /aria-valuenow="5"/);
    assert.equal(output.match(/rrp-content/g).length, 1);
    console.log(
      `${format}: packed consumer render passes (React ${React.version})`,
    );
  }
  const manifest = JSON.parse(
    await readFile(join(packageDir, "package.json"), "utf8"),
  );
  for (const entry of Object.values(manifest.exports["."]))
    await readFile(join(packageDir, entry));
} finally {
  await rm(fixture, { recursive: true, force: true });
}
