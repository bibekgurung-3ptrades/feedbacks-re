// Packs the @captify-io packages from their checkouts into .packs/ and points package.json at
// them, until the packages are published. The checkouts are captify-sdk and platform beside this
// module, or in CAPTIFY_CHECKOUTS, each built first. Run it again after changing them.
import { execFileSync, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const checkouts = resolve(process.env.CAPTIFY_CHECKOUTS ?? join(root, ".."));
const packs = join(root, ".packs");
const scratch = join(packs, "packing");
// npm is a .cmd script on Windows, which only a shell can start. The shell splits its command at
// spaces, so a path holding one is quoted.
const run = (args, cwd) => {
  const command = ["npm", ...args];
  if (process.platform !== "win32")
    return execFileSync(command[0], command.slice(1), {
      cwd,
      stdio: "inherit",
    });
  execSync(
    command.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg)).join(" "),
    {
      cwd,
      stdio: "inherit",
    },
  );
};

const manifestFile = join(root, "package.json");
const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
manifest.overrides ??= {};
rmSync(packs, { recursive: true, force: true });
for (const path of [
  "captify-sdk-re/packages/contracts",
  "captify-sdk-re/packages/tokens",
  "captify-sdk-re/packages/sdk",
  "captify-sdk-re/packages/ui",
  "captify-sdk-re/packages/logger",
  "platform-re",
]) {
  const dir = join(checkouts, path);
  if (!existsSync(join(dir, "dist"))) {
    console.error(
      `${dir} is missing or not built. Check it out and build it, then run this again.`,
    );
    process.exit(1);
  }
  const { name } = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  mkdirSync(scratch, { recursive: true });
  run(["pack", "--pack-destination", scratch, "--silent"], dir);
  const [file = ""] = readdirSync(scratch);
  // Named by its contents, so a changed package is installed afresh.
  const hash = createHash("sha256")
    .update(readFileSync(join(scratch, file)))
    .digest("hex")
    .slice(0, 12);
  const named = file.replace(/\.tgz$/, `-${hash}.tgz`);
  renameSync(join(scratch, file), join(packs, named));
  const spec = `file:.packs/${named}`;
  for (const list of [manifest.dependencies, manifest.devDependencies])
    if (list?.[name]) list[name] = spec;
  manifest.overrides[name] = spec;
}
rmSync(scratch, { recursive: true, force: true });
writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
run(["install"], root);

// A Next dev server running here may compile the stylesheet while npm swaps a package, in the
// moment the kit's stylesheet is missing. Tailwind then names no file to watch, so Turbopack keeps
// the failure until the stylesheet itself changes. Changing each stylesheet that imports the kit,
// and putting it back, has it compiled afresh.
if (existsSync(join(root, ".next", "dev", "lock"))) {
  const app = join(root, "app");
  const sheets = readdirSync(app, { recursive: true })
    .map((file) => join(app, String(file)))
    .filter((file) => file.endsWith(".css"))
    .map((file) => [file, readFileSync(file, "utf8")])
    .filter(([, text]) => text.includes("@captify-io/ui/styles.css"));
  try {
    for (const [file, text] of sheets) writeFileSync(file, `${text}\n`);
    await new Promise((done) => setTimeout(done, 1000));
  } finally {
    for (const [file, text] of sheets) writeFileSync(file, text);
  }
}
