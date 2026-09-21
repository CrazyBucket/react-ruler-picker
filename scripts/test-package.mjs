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

const consumer = createRequire(
  resolve(process.argv[2] ?? ".", "package.json"),
);
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
  // Test the installed dependency without relying on workspace resolution.
  const dependencyDir = join(fixture, "node_modules/tactile-motion");
  await mkdir(dependencyDir, { recursive: true });
  const localRequire = createRequire(resolve("package.json"));
  const dependencyRoot = resolve(
    dirname(localRequire.resolve("tactile-motion")),
    "..",
  );
  const [dependency] = JSON.parse(
    execFileSync(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", fixture],
      { cwd: dependencyRoot, encoding: "utf8" },
    ),
  );
  execFileSync("tar", [
    "-xzf",
    join(fixture, dependency.filename),
    "--strip-components=1",
    "-C",
    dependencyDir,
  ]);
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
    assert.equal(output.match(/rrp-surface/g).length, 1);
    assert.ok(!output.includes("rrp-content"));
    console.log(
      `${format}: packed consumer render passes (React ${React.version})`,
    );
  }
  const manifest = JSON.parse(
    await readFile(join(packageDir, "package.json"), "utf8"),
  );
  assert.match(manifest.dependencies["tactile-motion"], /^\^\d+\.\d+\.\d+$/);
  for (const entry of Object.values(manifest.exports["."]))
    await readFile(join(packageDir, entry));
  if (process.argv[2]) {
    assert.equal(React.version, "16.8.6");
    await symlink(
      dirname(consumer.resolve("react-dom/package.json")),
      join(fixture, "node_modules/react-dom"),
      "dir",
    );
    await symlink(
      dirname(localRequire.resolve("happy-dom/package.json")),
      join(fixture, "node_modules/happy-dom"),
      "dir",
    );
    const client = join(fixture, "client.mjs");
    await writeFile(client, await readFile("scripts/test-react16-client.mjs"));
    execFileSync(process.execPath, [client], { cwd: fixture, stdio: "inherit" });
  }
} finally {
  await rm(fixture, { recursive: true, force: true });
}
