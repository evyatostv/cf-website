// Postinstall shim (runs on every `npm install`, including Vercel).
//
// vite-react-ssg@0.9.1 renders on the server via `react-router-dom/server.js`
// (the react-router v6 layout). react-router v7 merged those server APIs into
// the main `react-router` package and its `react-router-dom` compat shim does
// NOT expose a `./server` subpath, so SSG fails with ERR_PACKAGE_PATH_NOT_EXPORTED.
//
// This script adds the missing subpath: it writes a tiny re-export module and
// registers `./server` + `./server.js` in the package's exports map. Idempotent.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

let pkgPath;
try {
  pkgPath = require.resolve("react-router-dom/package.json");
} catch {
  // react-router-dom not installed (e.g. deps not yet present) — nothing to do.
  process.exit(0);
}

const pkgDir = dirname(pkgPath);
const distDir = join(pkgDir, "dist");
const serverFile = join(distDir, "server.mjs");

const SHIM = `// Added by scripts/patch-react-router-dom.mjs — see that file for why.
export {
  StaticRouter,
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router";
`;

if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
if (!existsSync(serverFile) || readFileSync(serverFile, "utf8") !== SHIM) {
  writeFileSync(serverFile, SHIM);
}

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.exports = pkg.exports || {};
let changed = false;
for (const key of ["./server", "./server.js"]) {
  const target = { import: "./dist/server.mjs", default: "./dist/server.mjs" };
  if (JSON.stringify(pkg.exports[key]) !== JSON.stringify(target)) {
    pkg.exports[key] = target;
    changed = true;
  }
}
if (changed) {
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("[patch-react-router-dom] added ./server subpath");
}
