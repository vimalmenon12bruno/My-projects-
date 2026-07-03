/*
 * MTA html5 module build step.
 * The `mbt` builder runs `npm run build` in this folder; it expects the
 * deployable content in ./dist. We have no bundler — the app is a single
 * self-contained file — so we just assemble dist/ with a cross-platform copy.
 */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const out = path.join(root, "dist");
const files = ["index.html", "xs-app.json", "manifest.json"];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const f of files) {
  fs.copyFileSync(path.join(root, f), path.join(out, f));
}

console.log("[processforge-ui] built dist/ ->", fs.readdirSync(out).join(", "));
