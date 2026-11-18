#!/usr/bin/env node
/**
 * capture-marketing.mjs
 *
 * Thin, opinionated wrapper around scripts/capture-screens.mjs for the public
 * marketing pages. It uses the same dependency-free Chrome/CDP pipeline; this
 * file only supplies the route list and marketing-friendly defaults.
 *
 * Defaults:
 *   - desktop 1440x900 + mobile 390x844, full-page, dark theme
 *   - output: .design-review/screens/marketing
 *   - HTTP 404/410 routes are skipped so routes that are still being designed
 *     do not fail the whole run (`--strict` disables that).
 *
 * Screens under `public/` are shipped to production. Use --public only for
 * approved, PII-free assets:
 *   node scripts/capture-marketing.mjs --public
 */

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const CAPTURE_SCRIPT = join(SCRIPT_DIR, "capture-screens.mjs");
const DEFAULT_OUT = ".design-review/screens/marketing";
const PUBLIC_OUT = "public/screens/marketing";

const MARKETING_ROUTES = [
  "/",
  "/product",
  "/solutions",
  "/pricing",
  "/security",
  "/about",
  "/contact",
  "/blog",
  "/privacy",
  "/terms",
  "/data-handling",
  "/acceptable-use",
  "/docs",
  "/docs/getting-started/quickstart",
];

function printHelp() {
  console.log(`Marketing screenshot wrapper

Usage:
  node scripts/capture-marketing.mjs [options] [capture-screens options]

Wrapper options:
  --public         Write to ${PUBLIC_OUT} (these files are served publicly)
  --out <dir>      Write to a custom directory (default ${DEFAULT_OUT})
  --strict         Fail when a route returns HTTP 404/410 instead of skipping it
  --no-mobile      Capture desktop only (default is desktop + mobile)
  -h, --help       Show this help

Default routes (override with --routes or MARKETING_ROUTES):
  ${MARKETING_ROUTES.join("\n  ")}

Everything else is forwarded to scripts/capture-screens.mjs, for example:
  --base-url, --width, --height, --scale, --wait, --reduced-motion,
  --only, --dismiss, --storage-state, --element, --no-full-page, --port,
  --timeout, --chrome, --verbose

Environment:
  MARKETING_ROUTES   Comma-separated route list (same syntax as --routes)
  SCREENSHOT_*       Forwarded by capture-screens.mjs when not overridden

Examples:
  node scripts/capture-marketing.mjs
  node scripts/capture-marketing.mjs --reduced-motion --wait 1800
  node scripts/capture-marketing.mjs --only /,/pricing --no-mobile
  node scripts/capture-marketing.mjs --public
`);
}

function hasFlag(args, name) {
  return args.some((arg) => arg === name || arg.startsWith(`${name}=`));
}

const argv = process.argv.slice(2);

if (hasFlag(argv, "--help") || argv.includes("-h")) {
  printHelp();
  process.exit(0);
}

const publicMode = hasFlag(argv, "--public");
const strictMode = hasFlag(argv, "--strict");
const hasOut = hasFlag(argv, "--out");
const hasRoutesFlag = hasFlag(argv, "--routes");
const hasMobileSwitch = hasFlag(argv, "--mobile") || hasFlag(argv, "--no-mobile");

if (publicMode && hasOut) {
  console.error("Error: use --public or --out, not both.");
  process.exit(2);
}
if (publicMode && process.env.SCREENSHOT_OUT) {
  console.error(
    "Error: --public conflicts with SCREENSHOT_OUT. Unset the environment variable or use --out.",
  );
  process.exit(2);
}

// Strip wrapper-only flags; all remaining flags belong to capture-screens.mjs.
const forwarded = argv.filter((arg) => arg !== "--public" && arg !== "--strict");

if (!hasOut) {
  const outDir =
    publicMode
      ? PUBLIC_OUT
      : process.env.SCREENSHOT_OUT || DEFAULT_OUT;
  forwarded.push("--out", outDir);
}

if (!hasRoutesFlag) {
  if (process.env.MARKETING_ROUTES) {
    forwarded.push("--routes", process.env.MARKETING_ROUTES);
  } else if (!process.env.SCREENSHOT_ROUTES) {
    forwarded.push("--routes", MARKETING_ROUTES.join(","));
  }
}

if (!hasMobileSwitch) forwarded.push("--mobile");
if (!strictMode && !hasFlag(argv, "--skip-missing")) {
  forwarded.push("--skip-missing");
}

if (publicMode) {
  console.warn(
    [
      "! Writing marketing screenshots into public/.",
      "  Those files are served publicly and ship with the app.",
      "  Only use approved captures with no customer data, PII, secrets, or internal URLs.",
      "",
    ].join("\n"),
  );
}

const child = spawn(process.execPath, [CAPTURE_SCRIPT, ...forwarded], {
  stdio: "inherit",
  env: process.env,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    try {
      child.kill(signal);
    } catch {
      // The child may have already exited.
    }
  });
}

child.on("error", (error) => {
  console.error(`Error: could not start capture-screens.mjs: ${error.message}`);
  process.exit(2);
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`capture-screens.mjs was terminated by ${signal}.`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
