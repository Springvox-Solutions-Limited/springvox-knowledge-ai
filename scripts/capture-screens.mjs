#!/usr/bin/env node
/**
 * capture-screens.mjs
 *
 * Dependency-free screenshot pipeline for the Rekall-IQ web app.
 *
 * It launches Google Chrome in headless mode, reads the DevTools WebSocket URL
 * from Chrome's stderr, and drives the browser with the built-in Node WebSocket
 * (Node 22+). No Playwright, Puppeteer, or other npm package is used.
 *
 * What each capture does:
 *   1. Sets a device-metrics override (desktop or 390x844 mobile).
 *   2. Emulates `prefers-color-scheme: dark` (optionally reduced motion).
 *   3. Navigates, waits for the load event, fonts, and images.
 *   4. Hides known overlays, scrolls the page to trigger scroll reveals, and
 *      scrolls back to the top.
 *   5. Captures a full-page PNG (or a viewport / single-element PNG) and writes
 *      a deterministic filename plus an updatable manifest.json.
 *
 * Run `node scripts/capture-screens.mjs --help` for all options.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME_DEFAULT = "/usr/bin/google-chrome";
const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const DEFAULT_OUT = ".design-review/screens";
const DEFAULT_WIDTH = 1440;
const DEFAULT_HEIGHT = 900;
const DEFAULT_WAIT_MS = 1200;
const MOBILE_WIDTH = 390;
const MOBILE_HEIGHT = 844;
const DEFAULT_DISMISS = [
  "[data-screenshot-hide]",
  "[data-cookie-consent]",
  // Next.js dev server badge/issue indicator. This element only exists in dev;
  // hiding it keeps design-review screenshots free of dev chrome.
  "nextjs-portal",
];

// Chrome can produce enormous screenshots, but very large surfaces are slow and
// can fail. Clamp the CSS height so the *device-pixel* height stays under this.
const MAX_CAPTURE_DEVICE_PX = 32000;

const PAINT = {
  green: (text) => paint(32, text),
  yellow: (text) => paint(33, text),
  red: (text) => paint(31, text),
};

const cleanupState = {
  chrome: null,
  cdp: null,
  profileDir: null,
  cleaned: false,
};

/* -------------------------------------------------------------------------- */
/* CLI                                                                        */
/* -------------------------------------------------------------------------- */

function usageError(message) {
  const error = new Error(message);
  error.isUsageError = true;
  return error;
}

function paint(code, text) {
  if (!process.stdout.isTTY || process.env.NO_COLOR) return text;
  return `\u001b[${code}m${text}\u001b[0m`;
}

function parseBoolean(value, name) {
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  throw usageError(`${name} expects true or false, received "${value}".`);
}

function envBoolean(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return parseBoolean(raw, name);
}

function envNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw usageError(`${name} must be a number, received "${raw}".`);
  }
  return value;
}

function splitList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * CSS selectors can contain commas (for example `:is(header, footer)`), which
 * makes a plain comma split ambiguous. A JSON array can be used to pass those
 * selectors unambiguously; otherwise the value is split on commas.
 */
function parseSelectorList(value) {
  if (Array.isArray(value)) return splitList(value);
  const trimmed = String(value ?? "").trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return splitList(parsed);
    } catch {
      // Not JSON; fall back to comma splitting below.
    }
  }
  return splitList(trimmed);
}

function parseCli(argv) {
  const options = {
    baseUrl: process.env.SCREENSHOT_BASE_URL || DEFAULT_BASE_URL,
    out: process.env.SCREENSHOT_OUT || DEFAULT_OUT,
    routes: process.env.SCREENSHOT_ROUTES || null,
    width: envNumber("SCREENSHOT_WIDTH", DEFAULT_WIDTH),
    height: envNumber("SCREENSHOT_HEIGHT", DEFAULT_HEIGHT),
    scale: envNumber("SCREENSHOT_SCALE", 1),
    wait: envNumber("SCREENSHOT_WAIT", DEFAULT_WAIT_MS),
    mobile: envBoolean("SCREENSHOT_MOBILE", false),
    fullPage: envBoolean("SCREENSHOT_FULL_PAGE", true),
    reducedMotion: envBoolean("SCREENSHOT_REDUCED_MOTION", false),
    skipMissing: envBoolean("SCREENSHOT_SKIP_MISSING", false),
    only: process.env.SCREENSHOT_ONLY || null,
    dismiss: parseSelectorList(
      process.env.SCREENSHOT_DISMISS ?? DEFAULT_DISMISS,
    ),
    element: process.env.SCREENSHOT_ELEMENT || null,
    port: envNumber("SCREENSHOT_PORT", 0),
    timeout: envNumber("SCREENSHOT_TIMEOUT", 30000),
    storageState: process.env.SCREENSHOT_STORAGE_STATE || null,
    chrome: process.env.CHROME_BIN || CHROME_DEFAULT,
    verbose: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (raw === "-h" || raw === "--help") {
      options.help = true;
      continue;
    }
    if (!raw.startsWith("--")) {
      throw usageError(`Unexpected argument "${raw}". Options start with --.`);
    }

    let key = raw.slice(2);
    let inlineValue;
    const equalsIndex = key.indexOf("=");
    if (equalsIndex !== -1) {
      inlineValue = key.slice(equalsIndex + 1);
      key = key.slice(0, equalsIndex);
    }

    const takeValue = () => {
      if (inlineValue !== undefined) return inlineValue;
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) {
        throw usageError(`--${key} requires a value.`);
      }
      index += 1;
      return next;
    };

    switch (key) {
      case "base-url":
        options.baseUrl = takeValue();
        break;
      case "out":
        options.out = takeValue();
        break;
      case "routes":
        options.routes = takeValue();
        break;
      case "width":
        options.width = Number(takeValue());
        break;
      case "height":
        options.height = Number(takeValue());
        break;
      case "scale":
        options.scale = Number(takeValue());
        break;
      case "wait":
        options.wait = Number(takeValue());
        break;
      case "mobile":
        options.mobile =
          inlineValue === undefined
            ? true
            : parseBoolean(inlineValue, "--mobile");
        break;
      case "no-mobile":
        options.mobile = false;
        break;
      case "full-page":
        options.fullPage =
          inlineValue === undefined
            ? true
            : parseBoolean(inlineValue, "--full-page");
        break;
      case "no-full-page":
        options.fullPage = false;
        break;
      case "reduced-motion":
        options.reducedMotion =
          inlineValue === undefined
            ? true
            : parseBoolean(inlineValue, "--reduced-motion");
        break;
      case "skip-missing":
        options.skipMissing =
          inlineValue === undefined
            ? true
            : parseBoolean(inlineValue, "--skip-missing");
        break;
      case "only":
        options.only = takeValue();
        break;
      case "dismiss":
        options.dismiss = parseSelectorList(takeValue());
        break;
      case "element":
        options.element = takeValue();
        break;
      case "port":
        options.port = Number(takeValue());
        break;
      case "timeout":
        options.timeout = Number(takeValue());
        break;
      case "storage-state":
        options.storageState = takeValue();
        break;
      case "chrome":
        options.chrome = takeValue();
        break;
      case "verbose":
        options.verbose =
          inlineValue === undefined
            ? true
            : parseBoolean(inlineValue, "--verbose");
        break;
      default:
        throw usageError(`Unknown option --${key}.`);
    }
  }

  return options;
}

function printUsage(stream = process.stdout) {
  stream.write(`Screenshot capture pipeline (dependency-free, Chrome DevTools Protocol)

Usage:
  node scripts/capture-screens.mjs [options]

Core options:
  --base-url <url>       Base URL (default ${DEFAULT_BASE_URL}, env SCREENSHOT_BASE_URL)
  --out <dir>            Output directory (default ${DEFAULT_OUT}, env SCREENSHOT_OUT)
  --routes <spec>        Comma-separated routes, or a JSON manifest path
                         (default "/", env SCREENSHOT_ROUTES)
  --only <patterns>      Comma-separated route/name filters; "*" globs allowed
  --width <px>           Desktop viewport width (default ${DEFAULT_WIDTH})
  --height <px>          Desktop viewport height (default ${DEFAULT_HEIGHT})
  --scale <number>       Device scale factor (default 1; 2 = retina)
  --mobile               Also capture each route at ${MOBILE_WIDTH}x${MOBILE_HEIGHT}
  --no-mobile            Disable the mobile pass (default)
  --full-page            Capture the full page (default, env SCREENSHOT_FULL_PAGE)
  --no-full-page         Capture only the viewport
  --wait <ms>            Settle delay after load and after scrolling (default ${DEFAULT_WAIT_MS})
  --reduced-motion       Emulate prefers-reduced-motion: reduce
  --dismiss <selectors>  Overlay selectors to hide, comma-separated or a JSON
                         array (default "${DEFAULT_DISMISS.join(", ")}")
  --element <selector>   Capture one element instead of the page
  --skip-missing         Treat HTTP 404/410 as "skipped", not a failure
  --storage-state <file> Playwright-style storage state for authenticated captures
  --port <port>          Remote-debugging port (default 0 = Chrome chooses)
  --timeout <ms>         Navigation/CDP timeout (default 30000)
  --chrome <path>        Chrome executable (default ${CHROME_DEFAULT}, env CHROME_BIN)
  --verbose              Print extra diagnostics
  -h, --help             Show this help

Routes JSON manifest:
  [ "/", { "route": "/pricing", "name": "pricing-page", "wait": 800 } ]
  { "routes": [ ... ] }

Environment variables:
  SCREENSHOT_BASE_URL, SCREENSHOT_OUT, SCREENSHOT_ROUTES, SCREENSHOT_WIDTH,
  SCREENSHOT_HEIGHT, SCREENSHOT_SCALE, SCREENSHOT_WAIT, SCREENSHOT_MOBILE,
  SCREENSHOT_FULL_PAGE, SCREENSHOT_REDUCED_MOTION, SCREENSHOT_SKIP_MISSING,
  SCREENSHOT_ONLY, SCREENSHOT_DISMISS, SCREENSHOT_ELEMENT, SCREENSHOT_PORT,
  SCREENSHOT_TIMEOUT, SCREENSHOT_STORAGE_STATE, CHROME_BIN

Examples:
  node scripts/capture-screens.mjs
  node scripts/capture-screens.mjs --routes /,/product,/pricing --mobile
  node scripts/capture-screens.mjs --routes ./routes.json --out .design-review/screens/review
  node scripts/capture-screens.mjs --routes /dashboard --storage-state .design-review/auth-state.local.json --no-full-page
`);
}

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

function validateOptions(options) {
  if (!/^https?:\/\//i.test(options.baseUrl)) {
    throw usageError("--base-url must start with http:// or https://.");
  }
  try {
    new URL(options.baseUrl);
  } catch {
    throw usageError(`--base-url is not a valid URL: ${options.baseUrl}`);
  }
  options.baseUrl = options.baseUrl.replace(/\/+$/, "");

  if (!Number.isFinite(options.width) || options.width < 100 || options.width > 10000) {
    throw usageError("--width must be a number between 100 and 10000.");
  }
  if (!Number.isFinite(options.height) || options.height < 100 || options.height > 10000) {
    throw usageError("--height must be a number between 100 and 10000.");
  }
  if (!Number.isFinite(options.scale) || options.scale < 0.25 || options.scale > 4) {
    throw usageError("--scale must be a number between 0.25 and 4.");
  }
  if (!Number.isFinite(options.wait) || options.wait < 0 || options.wait > 300000) {
    throw usageError("--wait must be a number between 0 and 300000.");
  }
  if (
    !Number.isFinite(options.timeout) ||
    options.timeout < 1000 ||
    options.timeout > 300000
  ) {
    throw usageError("--timeout must be a number between 1000 and 300000.");
  }
  if (
    !Number.isInteger(options.port) ||
    options.port < 0 ||
    options.port > 65535
  ) {
    throw usageError("--port must be an integer between 0 and 65535.");
  }
  if (!options.chrome || !String(options.chrome).trim()) {
    throw usageError("--chrome requires a path to the Chrome executable.");
  }
  if (!options.out || !String(options.out).trim()) {
    throw usageError("--out requires a directory.");
  }

  options.width = Math.round(options.width);
  options.height = Math.round(options.height);
  options.wait = Math.round(options.wait);
  options.timeout = Math.round(options.timeout);
  options.dismiss = parseSelectorList(options.dismiss);
  options.element = options.element ? String(options.element).trim() : null;
  options.only = options.only ? String(options.only).trim() : null;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function routeSlug(entry) {
  if (entry.name) {
    const named = slugify(entry.name);
    if (named) return named;
  }

  let route = entry.route;
  let prefix = "";
  if (/^https?:\/\//i.test(route)) {
    try {
      const parsed = new URL(route);
      prefix = slugify(parsed.hostname);
      route = `${parsed.pathname}${parsed.search}`;
    } catch {
      // Fall through and slug the raw route.
    }
  }

  const slug = slugify(route.split("#")[0]);
  if (slug) return prefix ? `${prefix}-${slug}` : slug;
  return prefix || "home";
}

function resolveUrl(baseUrl, route) {
  if (/^https?:\/\//i.test(route)) return route;
  return `${baseUrl.replace(/\/+$/, "")}${route.startsWith("/") ? route : `/${route}`}`;
}

/* -------------------------------------------------------------------------- */
/* Route loading                                                              */
/* -------------------------------------------------------------------------- */

function normalizeRouteEntry(item, label) {
  if (typeof item === "string") {
    const route = item.trim();
    if (!route) throw usageError(`${label} contains an empty route.`);
    return { route };
  }

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw usageError(`${label} must be a string or an object.`);
  }

  const route = item.route ?? item.path ?? item.url;
  if (typeof route !== "string" || !route.trim()) {
    throw usageError(`${label} is missing a "route" (or "path"/"url") string.`);
  }

  const entry = { route: route.trim() };

  if (item.name !== undefined && item.name !== null) {
    entry.name = String(item.name);
  }
  if (item.wait !== undefined && item.wait !== null) {
    const wait = Number(item.wait);
    if (!Number.isFinite(wait) || wait < 0 || wait > 300000) {
      throw usageError(`${label}.wait must be a number between 0 and 300000.`);
    }
    entry.wait = Math.round(wait);
  }
  if (item.fullPage !== undefined && item.fullPage !== null) {
    entry.fullPage = parseBoolean(item.fullPage, `${label}.fullPage`);
  }
  if (item.mobile !== undefined && item.mobile !== null) {
    entry.mobile = parseBoolean(item.mobile, `${label}.mobile`);
  }
  if (item.skip !== undefined && item.skip !== null) {
    entry.skip = parseBoolean(item.skip, `${label}.skip`);
  }
  if (item.element !== undefined && item.element !== null) {
    entry.element = String(item.element);
  }
  if (item.dismiss !== undefined && item.dismiss !== null) {
    entry.dismiss = parseSelectorList(item.dismiss);
  }

  return entry;
}

function parseRouteManifest(text, source) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw usageError(`Invalid JSON in ${source}: ${error.message}`);
  }

  if (!Array.isArray(data) && data && Array.isArray(data.routes)) {
    data = data.routes;
  }
  if (!Array.isArray(data)) {
    throw usageError(
      `${source} must contain an array of routes or an object with a "routes" array.`,
    );
  }

  return data.map((item, index) =>
    normalizeRouteEntry(item, `${source}[${index}]`),
  );
}

function filterRoutes(entries, onlySpec) {
  const patterns = splitList(onlySpec);
  if (!patterns.length) return entries;

  const matchers = patterns.map((pattern) => {
    const glob = pattern.includes("*");
    const regex = glob
      ? new RegExp(
          `^${pattern
            .split("*")
            .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join(".*")}$`,
          "i",
        )
      : null;
    return { pattern, glob, regex };
  });

  const filtered = entries.filter((entry) =>
    matchers.some((matcher) => {
      const candidates = [
        entry.route,
        entry.route.replace(/\/+$/, ""),
        entry.name,
        routeSlug(entry),
      ].filter((candidate) => typeof candidate === "string");

      if (matcher.glob) {
        return candidates.some((candidate) => matcher.regex.test(candidate));
      }
      return candidates.some(
        (candidate) => candidate.toLowerCase() === matcher.pattern.toLowerCase(),
      );
    }),
  );

  if (!filtered.length) {
    throw usageError(
      `--only did not match any route. Tried: ${patterns.join(", ")}`,
    );
  }
  return filtered;
}

async function loadRoutes(spec, onlySpec) {
  let entries;

  if (!spec) {
    entries = [{ route: "/" }];
  } else {
    const trimmed = String(spec).trim();
    if (!trimmed) {
      entries = [{ route: "/" }];
    } else if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      entries = parseRouteManifest(trimmed, "--routes");
    } else {
      // A manifest must be a real file. This matters for "/" and other route
      // paths that happen to resolve to an existing directory.
      const candidate = resolve(trimmed);
      let isManifestFile = false;
      if (existsSync(candidate)) {
        try {
          isManifestFile = (await stat(candidate)).isFile();
        } catch {
          isManifestFile = false;
        }
      }

      if (isManifestFile || trimmed.endsWith(".json")) {
        let text;
        try {
          text = await readFile(candidate, "utf8");
        } catch (error) {
          throw usageError(`Cannot read routes manifest ${candidate}: ${error.message}`);
        }
        entries = parseRouteManifest(text, candidate);
      } else {
        entries = trimmed.split(",").map((route, index) =>
          normalizeRouteEntry(route, `--routes[${index}]`),
        );
      }
    }
  }

  if (!entries.length) throw usageError("No routes were configured.");
  return filterRoutes(entries, onlySpec);
}

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
/* -------------------------------------------------------------------------- */

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function pngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";
  if (
    !Buffer.isBuffer(buffer) ||
    buffer.length < 24 ||
    buffer.subarray(0, 8).toString("hex") !== signature
  ) {
    throw new Error("Chrome returned an invalid PNG payload.");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function writeFileAtomic(target, contents) {
  const temporary = `${target}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, contents);
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function writeManifest(manifest, outDir) {
  manifest.updatedAt = new Date().toISOString();
  const manifestPath = join(outDir, "manifest.json");
  await writeFileAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestPath;
}

/* -------------------------------------------------------------------------- */
/* Chrome process                                                             */
/* -------------------------------------------------------------------------- */

function signalChrome(child, signal) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;

  if (process.platform !== "win32" && child.pid) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
      // Fall back to signalling the main process only.
    }
  }

  try {
    child.kill(signal);
  } catch {
    // The process may already be gone.
  }
}

function waitForExit(child, timeoutMs) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve(true);
  }
  return new Promise((resolvePromise) => {
    let finished = false;
    const timer = setTimeout(() => finish(false), timeoutMs);
    const onExit = () => finish(true);
    const finish = (exited) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      child.off("exit", onExit);
      resolvePromise(exited);
    };
    child.once("exit", onExit);
  });
}

function waitForDevToolsUrl(child, timeoutMs) {
  return new Promise((resolvePromise, rejectPromise) => {
    let buffer = "";
    let settled = false;

    const timer = setTimeout(() => {
      finish(
        new Error(
          `Chrome did not print a DevTools WebSocket URL within ${timeoutMs} ms.`,
        ),
      );
    }, timeoutMs);

    const onData = (chunk) => {
      buffer = `${buffer}${String(chunk)}`.slice(-16000);
      const match = buffer.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) finish(null, match[1].trim());
    };
    const onError = (error) => finish(error);
    const onExit = (code, signal) =>
      finish(
        new Error(
          `Chrome exited before DevTools was ready (code ${code ?? "null"}, signal ${signal ?? "none"}).`,
        ),
      );

    const finish = (error, url) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stderr.off("data", onData);
      child.stdout.off("data", onData);
      child.off("error", onError);
      child.off("exit", onExit);
      // Keep draining both pipes so Chrome can never block on a full buffer.
      child.stderr.resume();
      child.stdout.resume();

      if (error) {
        error.chromeOutput = buffer.trim().split("\n").slice(-8).join("\n");
        rejectPromise(error);
      } else {
        resolvePromise(url);
      }
    };

    child.stderr.on("data", onData);
    child.stdout.on("data", onData);
    child.on("error", onError);
    child.on("exit", onExit);
  });
}

async function launchChrome(options) {
  if (!existsSync(options.chrome)) {
    throw new Error(
      `Chrome executable not found at ${options.chrome}. Set CHROME_BIN or use --chrome.`,
    );
  }

  const profileDir = await mkdtemp(join(tmpdir(), "capture-screens-"));
  const args = [
    "--headless=new",
    `--remote-debugging-port=${options.port}`,
    "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${profileDir}`,
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--font-render-hinting=none",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-sync",
    "--metrics-recording-only",
    "--mute-audio",
    "--no-first-run",
    "--no-default-browser-check",
    `--window-size=${Math.max(options.width, 800)},${Math.max(options.height, 600)}`,
    "about:blank",
  ];

  let child;
  try {
    child = spawn(options.chrome, args, {
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    await rm(profileDir, { recursive: true, force: true }).catch(
      () => undefined,
    );
    throw new Error(`Could not spawn Chrome at ${options.chrome}: ${error.message}`);
  }

  try {
    const wsUrl = await waitForDevToolsUrl(child, 20000);
    return { child, wsUrl, profileDir };
  } catch (error) {
    signalChrome(child, "SIGKILL");
    await waitForExit(child, 2000);
    await rm(profileDir, { recursive: true, force: true }).catch(
      () => undefined,
    );
    const chromeOutput = error.chromeOutput
      ? `\nChrome output:\n${error.chromeOutput}`
      : "";
    throw new Error(
      `Chrome could not start for screenshot capture: ${error.message}${chromeOutput}`,
    );
  }
}

async function stopChrome(chrome) {
  const child = chrome?.child;
  if (!child || child.exitCode !== null || child.signalCode !== null) return;

  signalChrome(child, "SIGTERM");
  const exited = await waitForExit(child, 4000);
  if (!exited) {
    signalChrome(child, "SIGKILL");
    await waitForExit(child, 2000);
  }
}

async function cleanupRun() {
  if (cleanupState.cleaned) return;
  cleanupState.cleaned = true;

  const { cdp, chrome, profileDir } = cleanupState;

  if (cdp && !cdp.closed) {
    try {
      await cdp.send("Browser.close", {}, undefined, 3000);
    } catch {
      // Browser.close can race with the socket closing; SIGTERM below is enough.
    }
    cdp.close();
  }

  await stopChrome(chrome);

  if (profileDir) {
    try {
      await rm(profileDir, {
        recursive: true,
        force: true,
        maxRetries: 6,
        retryDelay: 120,
      });
    } catch (error) {
      console.warn(
        `Warning: could not remove the temporary Chrome profile ${profileDir}: ${error.message}`,
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/* CDP connection                                                             */
/* -------------------------------------------------------------------------- */

class CdpConnection {
  constructor(url, defaultTimeoutMs) {
    this.url = url;
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.waiters = new Set();
    this.closed = false;
  }

  async open(timeoutMs = 15000) {
    if (typeof WebSocket !== "function") {
      throw new Error(
        "This script requires Node.js 22+ (global WebSocket is unavailable).",
      );
    }

    await new Promise((resolvePromise, rejectPromise) => {
      let settled = false;
      const ws = new WebSocket(this.url);
      this.ws = ws;

      const timer = setTimeout(() => {
        finish(
          new Error(
            `Timed out connecting to Chrome DevTools at ${this.url} after ${timeoutMs} ms.`,
          ),
        );
      }, timeoutMs);

      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        ws.removeEventListener("open", onOpen);
        ws.removeEventListener("error", onError);
        ws.removeEventListener("close", onClose);
        if (error) {
          try {
            ws.close();
          } catch {
            // Ignore.
          }
          rejectPromise(error);
        } else {
          ws.addEventListener("error", () => {
            // The close handler below reports the failure to pending commands.
          });
          ws.addEventListener("close", () => this.handleClose());
          resolvePromise();
        }
      };

      const onOpen = () => finish(null);
      const onError = () =>
        finish(
          new Error(
            `WebSocket error while connecting to Chrome DevTools at ${this.url}.`,
          ),
        );
      const onClose = () =>
        finish(
          new Error(
            `DevTools WebSocket closed before connecting (${this.url}).`,
          ),
        );

      ws.addEventListener("open", onOpen);
      ws.addEventListener("error", onError);
      ws.addEventListener("close", onClose);
      ws.addEventListener("message", (event) => this.handleMessage(event));
    });
  }

  on(method, handler) {
    if (!this.listeners.has(method)) this.listeners.set(method, new Set());
    this.listeners.get(method).add(handler);
    return () => {
      const handlers = this.listeners.get(method);
      if (!handlers) return;
      handlers.delete(handler);
      if (!handlers.size) this.listeners.delete(method);
    };
  }

  waitForEvent(method, { sessionId, timeoutMs = this.defaultTimeoutMs, predicate } = {}) {
    let settled = false;
    let timer = null;
    let unsubscribe = null;
    let resolvePromise;
    let rejectPromise;

    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    // Callers sometimes fail before awaiting the event (for example, a
    // navigation error). Attach a no-op handler to avoid unhandled rejections.
    promise.catch(() => undefined);

    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
      this.waiters.delete(waiter);
      if (error) rejectPromise(error);
      else resolvePromise(value);
    };

    const waiter = {
      reject: (error) => finish(error),
    };
    this.waiters.add(waiter);

    timer = setTimeout(() => {
      finish(
        new Error(
          `Timed out after ${timeoutMs} ms waiting for CDP event "${method}".`,
        ),
      );
    }, timeoutMs);

    unsubscribe = this.on(method, (event) => {
      if (sessionId !== undefined && event.sessionId !== sessionId) return;
      if (predicate && !predicate(event.params)) return;
      finish(null, event.params);
    });

    return {
      promise,
      cancel: () => finish(null, null),
    };
  }

  send(method, params = {}, sessionId, timeoutMs = this.defaultTimeoutMs) {
    if (this.closed || !this.ws || this.ws.readyState !== 1) {
      return Promise.reject(
        new Error(`Cannot send CDP "${method}": the DevTools connection is not open.`),
      );
    }

    const id = this.nextId;
    this.nextId += 1;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;

    return new Promise((resolvePromise, rejectPromise) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        rejectPromise(
          new Error(`CDP "${method}" timed out after ${timeoutMs} ms.`),
        );
      }, timeoutMs);

      this.pending.set(id, {
        method,
        resolve: resolvePromise,
        reject: rejectPromise,
        timer,
      });

      try {
        this.ws.send(JSON.stringify(payload));
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        rejectPromise(
          new Error(`Could not send CDP "${method}" to Chrome: ${error.message}`),
        );
      }
    });
  }

  handleMessage(event) {
    let message;
    try {
      const raw =
        typeof event.data === "string"
          ? event.data
          : Buffer.from(event.data).toString("utf8");
      message = JSON.parse(raw);
    } catch {
      return;
    }

    if (message.id !== undefined) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      clearTimeout(pending.timer);

      if (message.error) {
        const detail = message.error.data ? ` (${message.error.data})` : "";
        pending.reject(
          new Error(
            `CDP "${pending.method}" failed: ${message.error.message}${detail}`,
          ),
        );
      } else {
        pending.resolve(message.result ?? {});
      }
      return;
    }

    if (!message.method) return;

    const handlers = this.listeners.get(message.method);
    if (handlers) {
      for (const handler of [...handlers]) {
        try {
          handler({
            method: message.method,
            params: message.params ?? {},
            sessionId: message.sessionId,
          });
        } catch (error) {
          if (process.env.SCREENSHOT_DEBUG) {
            console.warn(
              `CDP event handler for ${message.method} threw: ${error.message}`,
            );
          }
        }
      }
    }
  }

  handleClose() {
    if (this.closed) return;
    this.closed = true;
    const error = new Error("Chrome closed the DevTools WebSocket.");

    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();

    for (const waiter of [...this.waiters]) {
      waiter.reject(error);
    }
    this.waiters.clear();
    this.listeners.clear();
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    const error = new Error("DevTools connection closed by the capture script.");

    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();

    for (const waiter of [...this.waiters]) {
      waiter.reject(error);
    }
    this.waiters.clear();
    this.listeners.clear();

    try {
      this.ws?.close();
    } catch {
      // Ignore.
    }
    this.ws = null;
  }
}

/* -------------------------------------------------------------------------- */
/* Page setup                                                                 */
/* -------------------------------------------------------------------------- */

async function createPage(cdp) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });

  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Network.enable", {}, sessionId);
  await cdp.send("DOM.enable", {}, sessionId);

  cdp.on("Page.javascriptDialogOpening", (event) => {
    if (event.sessionId !== sessionId) return;
    cdp
      .send("Page.handleJavaScriptDialog", { accept: true }, sessionId, 5000)
      .catch(() => undefined);
  });

  return { targetId, sessionId };
}

async function getMainFrameId(cdp, sessionId) {
  const { frameTree } = await cdp.send("Page.getFrameTree", {}, sessionId);
  return frameTree.frame.id;
}

async function configureViewport(cdp, sessionId, viewport) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.scale,
      mobile: viewport.mobile,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
      screenOrientation: {
        type: viewport.mobile ? "portraitPrimary" : "landscapePrimary",
        angle: viewport.mobile ? 0 : 90,
      },
    },
    sessionId,
  );

  await cdp.send(
    "Emulation.setTouchEmulationEnabled",
    {
      enabled: viewport.mobile,
      maxTouchPoints: viewport.mobile ? 5 : 1,
    },
    sessionId,
  );
}

async function setEmulatedMedia(cdp, sessionId, reducedMotion) {
  await cdp.send(
    "Emulation.setEmulatedMedia",
    {
      media: "",
      features: [
        { name: "prefers-color-scheme", value: "dark" },
        {
          name: "prefers-reduced-motion",
          value: reducedMotion ? "reduce" : "no-preference",
        },
      ],
    },
    sessionId,
  );
}

async function evaluate(cdp, sessionId, expression, timeoutMs = 15000) {
  const result = await cdp.send(
    "Runtime.evaluate",
    {
      expression,
      awaitPromise: true,
      returnByValue: true,
    },
    sessionId,
    timeoutMs,
  );

  if (result.exceptionDetails) {
    const description =
      result.exceptionDetails.exception?.description ||
      result.exceptionDetails.text ||
      "Runtime.evaluate failed";
    throw new Error(String(description).split("\n")[0]);
  }
  return result.result?.value;
}

/* -------------------------------------------------------------------------- */
/* Page interaction                                                           */
/* -------------------------------------------------------------------------- */

function readinessExpression(imagesOnly) {
  const fonts = imagesOnly
    ? ""
    : `
      try {
        if (document.fonts && document.fonts.ready) {
          await Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 4000)),
          ]);
        }
      } catch (error) {
        // Font loading failures should not abort a capture.
      }
    `;

  return `(async () => {
    ${fonts}
    const pending = Array.from(document.images).filter((image) => !image.complete);
    await Promise.all(pending.map((image) => new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", finish, { once: true });
      setTimeout(finish, 4000);
    })));
    return {
      pendingImages: pending.length,
      fontStatus: document.fonts ? document.fonts.status : "unsupported",
    };
  })()`;
}

async function waitForReady(cdp, sessionId, warnings, { imagesOnly = false } = {}) {
  try {
    await evaluate(cdp, sessionId, readinessExpression(imagesOnly), 15000);
  } catch (error) {
    warnings.push(`Page readiness check failed: ${error.message}`);
  }
}

function dismissalExpression(selectors) {
  return `(() => {
    const selectors = ${JSON.stringify(selectors)};
    const report = { hidden: 0, matched: 0, failed: [] };
    for (const selector of selectors) {
      let nodes;
      try {
        nodes = document.querySelectorAll(selector);
      } catch (error) {
        report.failed.push({ selector, error: String(error && error.message ? error.message : error) });
        continue;
      }
      report.matched += nodes.length;
      for (const node of nodes) {
        if (!(node instanceof HTMLElement)) continue;
        node.style.setProperty("display", "none", "important");
        node.setAttribute("data-screenshot-dismissed", "");
        report.hidden += 1;
      }
    }
    return report;
  })()`;
}

async function dismissOverlays(cdp, sessionId, selectors, warnings) {
  if (!selectors.length) return;
  try {
    const report = await evaluate(cdp, sessionId, dismissalExpression(selectors), 10000);
    if (report?.failed?.length) {
      for (const failure of report.failed) {
        warnings.push(`Dismiss selector "${failure.selector}" is invalid: ${failure.error}`);
      }
    }
  } catch (error) {
    warnings.push(`Could not dismiss overlays: ${error.message}`);
  }
}

function scrollExpression() {
  return `(async () => {
    const root = document.scrollingElement || document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    const total = Math.max(
      root.scrollHeight,
      document.body ? document.body.scrollHeight : 0,
    );
    const viewport = window.innerHeight || 800;
    const step = Math.max(200, Math.floor(viewport * 0.8));
    const limit = Math.min(total, 400000);
    const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    let y = 0;
    for (let index = 0; index < 300 && y < limit; index += 1) {
      y += step;
      window.scrollTo(0, Math.min(y, limit));
      await pause(40);
    }
    window.scrollTo(0, limit);
    await pause(120);
    window.scrollTo(0, 0);
    await pause(80);
    root.style.scrollBehavior = previousBehavior;
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    return { height: total, viewport, scrollY: window.scrollY };
  })()`;
}

async function scrollThroughPage(cdp, sessionId, warnings) {
  try {
    const info = await evaluate(cdp, sessionId, scrollExpression(), 40000);
    if (info && info.scrollY !== 0) {
      warnings.push(
        `Page did not return to the top after scrolling (scrollY=${info.scrollY}).`,
      );
    }
  } catch (error) {
    warnings.push(`Scroll pass failed: ${error.message}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Screenshot capture                                                         */
/* -------------------------------------------------------------------------- */

function decodeScreenshot(result) {
  if (!result?.data) throw new Error("Chrome returned an empty screenshot.");
  return Buffer.from(result.data, "base64");
}

function clampCapture(width, height, scale, warnings) {
  const maxWidth = Math.floor(MAX_CAPTURE_DEVICE_PX / scale);
  const maxHeight = Math.floor(MAX_CAPTURE_DEVICE_PX / scale);
  let clampedWidth = width;
  let clampedHeight = height;

  if (clampedWidth > maxWidth) {
    warnings.push(
      `Capture width ${clampedWidth}px was clamped to ${maxWidth}px (Chrome surface limit at ${scale}x).`,
    );
    clampedWidth = maxWidth;
  }
  if (clampedHeight > maxHeight) {
    warnings.push(
      `Capture height ${clampedHeight}px was clamped to ${maxHeight}px (Chrome surface limit at ${scale}x).`,
    );
    clampedHeight = maxHeight;
  }
  return { width: clampedWidth, height: clampedHeight };
}

async function captureFullPage(cdp, sessionId, viewport, options, warnings) {
  const metrics = await cdp.send("Page.getLayoutMetrics", {}, sessionId);
  const content = metrics.cssContentSize || metrics.contentSize;
  // Keep full-page images exactly viewport-wide. Content that overflows
  // horizontally is clipped, which matches what a visitor sees without
  // horizontal scrolling and keeps marketing assets at predictable sizes.
  const width = viewport.width;
  const contentHeight = Number(content?.height);
  const height = Math.max(
    viewport.height,
    Number.isFinite(contentHeight) ? Math.ceil(contentHeight) : viewport.height,
  );
  const clamped = clampCapture(width, height, viewport.scale, warnings);

  const result = await cdp.send(
    "Page.captureScreenshot",
    {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width: clamped.width,
        height: clamped.height,
        scale: 1,
      },
    },
    sessionId,
    Math.max(options.timeout, 60000),
  );

  return { buffer: decodeScreenshot(result) };
}

async function captureViewport(cdp, sessionId, options) {
  const result = await cdp.send(
    "Page.captureScreenshot",
    {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    },
    sessionId,
    Math.max(options.timeout, 60000),
  );

  return { buffer: decodeScreenshot(result) };
}

async function captureElement(cdp, sessionId, selector, viewport, options, warnings) {
  const selectorJson = JSON.stringify(selector);
  const scrolled = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const element = document.querySelector(${selectorJson});
      if (!element) return null;
      element.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
      return true;
    })()`,
    10000,
  );
  if (!scrolled) throw new Error(`Element not found: ${selector}`);

  await sleep(250);

  // DOM.getBoxModel returns viewport-relative coordinates in current Chrome.
  // Compare with getBoundingClientRect so a future Chrome change cannot silently
  // crop the wrong region.
  const rect = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const element = document.querySelector(${selectorJson});
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      return {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      };
    })()`,
    10000,
  );
  if (!rect) throw new Error(`Element not found: ${selector}`);

  const { root } = await cdp.send("DOM.getDocument", { depth: 1 }, sessionId);
  const { nodeId } = await cdp.send(
    "DOM.querySelector",
    { nodeId: root.nodeId, selector },
    sessionId,
  );
  if (!nodeId) throw new Error(`Element not found: ${selector}`);

  const { model } = await cdp.send("DOM.getBoxModel", { nodeId }, sessionId);
  const quad = model.border || model.content || model.padding;
  if (!quad || quad.length !== 8) {
    throw new Error(`Could not measure element "${selector}" (no box model).`);
  }

  const xs = [quad[0], quad[2], quad[4], quad[6]];
  const ys = [quad[1], quad[3], quad[5], quad[7]];
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const viewportRelative =
    Math.abs(minX - rect.x) <= 2 && Math.abs(minY - rect.y) <= 2;
  const scrollX = viewportRelative ? rect.scrollX : 0;
  const scrollY = viewportRelative ? rect.scrollY : 0;

  const width = Math.max(1, Math.ceil(maxX - minX));
  const height = Math.max(1, Math.ceil(maxY - minY));
  const clamped = clampCapture(width, height, viewport.scale, warnings);

  const result = await cdp.send(
    "Page.captureScreenshot",
    {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: true,
      clip: {
        x: Math.max(0, Math.floor(minX + scrollX)),
        y: Math.max(0, Math.floor(minY + scrollY)),
        width: clamped.width,
        height: clamped.height,
        scale: 1,
      },
    },
    sessionId,
    Math.max(options.timeout, 60000),
  );

  return { buffer: decodeScreenshot(result) };
}

async function captureOne({
  cdp,
  page,
  entry,
  viewport,
  waitMs,
  fullPage,
  element,
  dismiss,
  options,
}) {
  const { sessionId } = page;
  const url = resolveUrl(options.baseUrl, entry.route);
  const warnings = [];
  const errors = [];

  await configureViewport(cdp, sessionId, viewport);
  await setEmulatedMedia(cdp, sessionId, options.reducedMotion);

  const frameId = await getMainFrameId(cdp, sessionId);
  let httpStatus = null;
  let networkError = null;

  const unsubscribeResponse = cdp.on("Network.responseReceived", (event) => {
    if (event.sessionId !== sessionId) return;
    if (event.params.type !== "Document") return;
    if (event.params.frameId !== frameId) return;
    const status = event.params.response?.status;
    if (typeof status === "number") httpStatus = status;
  });

  const unsubscribeFailure = cdp.on("Network.loadingFailed", (event) => {
    if (event.sessionId !== sessionId) return;
    if (event.params.type !== "Document") return;
    if (event.params.frameId !== frameId) return;
    networkError = event.params.errorText || "network error";
  });

  const loadWaiter = cdp.waitForEvent("Page.loadEventFired", {
    sessionId,
    timeoutMs: options.timeout,
  });

  try {
    let navigation;
    try {
      navigation = await cdp.send(
        "Page.navigate",
        { url },
        sessionId,
        options.timeout,
      );
    } catch (error) {
      loadWaiter.cancel();
      throw new Error(`Navigation to ${url} failed: ${error.message}`);
    }

    if (navigation.errorText) {
      loadWaiter.cancel();
      throw new Error(`Navigation to ${url} failed: ${navigation.errorText}`);
    }
    if (navigation.isDownload) {
      loadWaiter.cancel();
      throw new Error(`Navigation to ${url} started a download instead of a page.`);
    }

    try {
      await loadWaiter.promise;
    } catch (error) {
      if (String(error.message).startsWith("Timed out after")) {
        throw new Error(
          `Timed out after ${options.timeout} ms waiting for the load event of ${url}. Try a larger --timeout on a cold dev server.`,
        );
      }
      throw new Error(`Load event for ${url} failed: ${error.message}`);
    }

    if (httpStatus === null && networkError && networkError !== "net::ERR_ABORTED") {
      throw new Error(`Network error loading ${url}: ${networkError}`);
    }

    if (
      httpStatus !== null &&
      httpStatus >= 400 &&
      options.skipMissing &&
      (httpStatus === 404 || httpStatus === 410)
    ) {
      return {
        status: "skipped",
        httpStatus,
        buffer: null,
        image: null,
        warnings,
        errors: [`HTTP ${httpStatus} for ${url} (route treated as missing)`],
      };
    }

    if (httpStatus !== null && httpStatus >= 400) {
      errors.push(`HTTP ${httpStatus} returned by ${url}`);
    }

    await waitForReady(cdp, sessionId, warnings);
    await dismissOverlays(cdp, sessionId, dismiss, warnings);
    await scrollThroughPage(cdp, sessionId, warnings);

    // Lazy-loaded images usually start during the scroll pass.
    await waitForReady(cdp, sessionId, warnings, { imagesOnly: true });
    await sleep(waitMs);
    await dismissOverlays(cdp, sessionId, dismiss, warnings);
    await sleep(Math.min(250, waitMs));

    let capture;
    if (element) {
      capture = await captureElement(
        cdp,
        sessionId,
        element,
        viewport,
        options,
        warnings,
      );
    } else if (fullPage) {
      capture = await captureFullPage(
        cdp,
        sessionId,
        viewport,
        options,
        warnings,
      );
    } else {
      capture = await captureViewport(cdp, sessionId, options);
    }

    const dimensions = pngDimensions(capture.buffer);
    return {
      status: errors.length ? "error" : "ok",
      httpStatus,
      buffer: capture.buffer,
      image: { ...dimensions, bytes: capture.buffer.length },
      warnings,
      errors,
    };
  } finally {
    loadWaiter.cancel();
    unsubscribeResponse();
    unsubscribeFailure();
  }
}

/* -------------------------------------------------------------------------- */
/* Storage state (authenticated captures)                                     */
/* -------------------------------------------------------------------------- */

function normalizeCookie(cookie, index) {
  if (!cookie || typeof cookie !== "object") {
    throw new Error(`storageState.cookies[${index}] must be an object.`);
  }
  if (typeof cookie.name !== "string" || !cookie.name) {
    throw new Error(`storageState.cookies[${index}].name is required.`);
  }
  if (typeof cookie.value !== "string") {
    throw new Error(`storageState.cookies[${index}].value must be a string.`);
  }

  const normalized = { name: cookie.name, value: cookie.value };

  for (const key of ["url", "domain", "path"]) {
    if (typeof cookie[key] === "string" && cookie[key]) normalized[key] = cookie[key];
  }
  if (!normalized.url && !normalized.domain) {
    throw new Error(
      `storageState.cookies[${index}] needs a domain (or url) to be applied.`,
    );
  }
  if (normalized.domain && !normalized.path) normalized.path = "/";

  if (typeof cookie.secure === "boolean") normalized.secure = cookie.secure;
  if (typeof cookie.httpOnly === "boolean") normalized.httpOnly = cookie.httpOnly;
  if (
    typeof cookie.expires === "number" &&
    Number.isFinite(cookie.expires)
  ) {
    normalized.expires = cookie.expires;
  }
  if (cookie.sameSite) {
    const map = { strict: "Strict", lax: "Lax", none: "None" };
    const sameSite = map[String(cookie.sameSite).toLowerCase()];
    if (!sameSite) {
      throw new Error(
        `storageState.cookies[${index}].sameSite must be Strict, Lax, or None.`,
      );
    }
    normalized.sameSite = sameSite;
  }

  return normalized;
}

function normalizeOrigin(origin, index) {
  if (!origin || typeof origin !== "object") {
    throw new Error(`storageState.origins[${index}] must be an object.`);
  }
  if (typeof origin.origin !== "string") {
    throw new Error(`storageState.origins[${index}].origin is required.`);
  }

  let parsed;
  try {
    parsed = new URL(origin.origin);
  } catch {
    throw new Error(
      `storageState.origins[${index}].origin is not a valid URL: ${origin.origin}`,
    );
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error(
      `storageState.origins[${index}].origin must use http or https.`,
    );
  }

  const localStorage = Array.isArray(origin.localStorage)
    ? origin.localStorage
    : [];
  const items = localStorage.map((item, itemIndex) => {
    if (
      !item ||
      typeof item.name !== "string" ||
      typeof item.value !== "string"
    ) {
      throw new Error(
        `storageState.origins[${index}].localStorage[${itemIndex}] must have string name and value fields.`,
      );
    }
    return { name: item.name, value: item.value };
  });

  return { origin: parsed.origin, localStorage: items };
}

async function loadStorageState(filePath) {
  const absolute = resolve(filePath);
  let raw;
  try {
    raw = await readFile(absolute, "utf8");
  } catch (error) {
    throw new Error(`Cannot read --storage-state file ${absolute}: ${error.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in --storage-state ${absolute}: ${error.message}`);
  }

  let cookies = [];
  let origins = [];
  if (Array.isArray(data)) {
    cookies = data;
  } else if (data && typeof data === "object") {
    if (Array.isArray(data.cookies)) cookies = data.cookies;
    if (Array.isArray(data.origins)) origins = data.origins;
  } else {
    throw new Error(
      "--storage-state must contain a cookie array or an object with cookies/origins.",
    );
  }

  try {
    const info = await stat(absolute);
    if (process.platform !== "win32" && (info.mode & 0o077) !== 0) {
      console.warn(
        `Warning: ${filePath} is readable by other users. Run "chmod 600 ${filePath}".`,
      );
    }
  } catch {
    // The file is already readable if we got this far.
  }

  const normalizedCookies = cookies.map(normalizeCookie);
  const normalizedOrigins = origins.map(normalizeOrigin);
  if (!normalizedCookies.length && !normalizedOrigins.length) {
    throw new Error("--storage-state contains no cookies or localStorage origins.");
  }

  return { cookies: normalizedCookies, origins: normalizedOrigins, file: absolute };
}

async function applyStorageState(cdp, sessionId, storageState) {
  if (!storageState) return;

  if (storageState.cookies.length) {
    try {
      await cdp.send(
        "Network.setCookies",
        { cookies: storageState.cookies },
        sessionId,
        15000,
      );
    } catch (error) {
      throw new Error(
        `Could not apply cookies from --storage-state: ${error.message}`,
      );
    }
  }

  for (const origin of storageState.origins) {
    if (!origin.localStorage.length) continue;
    const pairs = origin.localStorage.map((item) => [item.name, item.value]);
    const source = `(() => {
      try {
        if (window.location.origin !== ${JSON.stringify(origin.origin)}) return;
        const entries = ${JSON.stringify(pairs)};
        for (const [key, value] of entries) {
          window.localStorage.setItem(key, value);
        }
      } catch (error) {
        // localStorage can be unavailable in rare page contexts; ignore.
      }
    })();`;
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source }, sessionId);
  }

  console.log(
    `Loaded auth state: ${storageState.cookies.length} cookie(s), ${storageState.origins.length} localStorage origin(s) (values hidden).`,
  );
}

/* -------------------------------------------------------------------------- */
/* Capture loop                                                              */
/* -------------------------------------------------------------------------- */

function buildJobs(routes, options) {
  const jobs = [];

  for (const entry of routes) {
    if (entry.skip) continue;

    const shared = {
      entry,
      waitMs: entry.wait ?? options.wait,
      fullPage: entry.fullPage ?? options.fullPage,
      element: entry.element ?? options.element,
      dismiss: entry.dismiss ?? options.dismiss,
    };

    jobs.push({
      ...shared,
      kind: "desktop",
      viewport: {
        width: options.width,
        height: options.height,
        scale: options.scale,
        mobile: false,
      },
    });

    if (entry.mobile ?? options.mobile) {
      jobs.push({
        ...shared,
        kind: "mobile",
        viewport: {
          width: MOBILE_WIDTH,
          height: MOBILE_HEIGHT,
          scale: options.scale,
          mobile: true,
        },
      });
    }
  }

  return jobs;
}

function uniqueFileName(entry, mobile, usedFiles) {
  const stem = `${routeSlug(entry)}${mobile ? "-mobile" : ""}`;
  let candidate = `${stem}.png`;
  let counter = 2;
  while (usedFiles.has(candidate)) {
    candidate = `${stem}-${counter}.png`;
    counter += 1;
  }
  usedFiles.add(candidate);
  return candidate;
}

function makeRecord({ entry, viewport, file, fullPage, element, url }) {
  return {
    route: entry.route,
    name: entry.name ?? null,
    url,
    file,
    viewport: { ...viewport },
    fullPage: Boolean(fullPage && !element),
    element: element ?? null,
    status: "error",
    httpStatus: null,
    image: null,
    warnings: [],
    errors: [],
    capturedAt: null,
    durationMs: 0,
  };
}

function makePreskippedRecord(entry, options) {
  return {
    route: entry.route,
    name: entry.name ?? null,
    url: resolveUrl(options.baseUrl, entry.route),
    file: null,
    viewport: null,
    fullPage: Boolean(entry.fullPage ?? options.fullPage),
    element: entry.element ?? options.element ?? null,
    status: "skipped",
    httpStatus: null,
    image: null,
    warnings: [],
    errors: ["Skipped by the routes manifest."],
    capturedAt: new Date().toISOString(),
    durationMs: 0,
  };
}

function printResult(record) {
  const status =
    record.status === "ok"
      ? PAINT.green("ok")
      : record.status === "skipped"
        ? PAINT.yellow("skipped")
        : PAINT.red("FAILED");

  let details = "";
  if (record.image) {
    details = `${record.file}  ${record.image.width}x${record.image.height}  ${formatBytes(record.image.bytes)}`;
  } else if (record.status === "skipped") {
    details = record.errors[0] || "skipped";
  }

  console.log(`${status}  ${details}`);

  for (const warning of record.warnings.slice(0, 3)) {
    console.log(`    warning: ${warning}`);
  }
  if (record.warnings.length > 3) {
    console.log(`    warning: (+${record.warnings.length - 3} more in manifest)`);
  }
  if (record.status === "error") {
    for (const error of record.errors.slice(0, 3)) {
      console.log(`    error: ${error}`);
    }
  }
}

function printSummary(summary, outDir) {
  const elapsed = ((summary.finishedAt - summary.startedAt) / 1000).toFixed(1);
  const parts = [`${summary.ok} captured`];
  if (summary.skipped) parts.push(`${summary.skipped} skipped`);
  if (summary.failures) parts.push(PAINT.red(`${summary.failures} failed`));

  console.log(`\n${parts.join(", ")} in ${elapsed}s.`);
  if (summary.failureDetails.length) {
    console.log("Failed captures:");
    for (const failure of summary.failureDetails) {
      console.log(`  - ${failure.label}: ${failure.error}`);
    }
  }
  console.log(`Output:   ${outDir}`);
  console.log(`Manifest: ${join(outDir, "manifest.json")}`);
}

async function runCaptures({ cdp, page, options, routes, outDir, storageState }) {
  const startedAt = Date.now();
  const manifest = {
    generator: "scripts/capture-screens.mjs",
    version: 1,
    generatedAt: new Date(startedAt).toISOString(),
    updatedAt: new Date(startedAt).toISOString(),
    finishedAt: null,
    baseUrl: options.baseUrl,
    outDir,
    chrome: { executable: options.chrome, headless: true },
    options: {
      width: options.width,
      height: options.height,
      scale: options.scale,
      wait: options.wait,
      fullPage: options.fullPage,
      mobile: options.mobile,
      reducedMotion: options.reducedMotion,
      element: options.element,
      dismiss: options.dismiss,
      skipMissing: options.skipMissing,
      storageState: Boolean(storageState),
    },
    auth: storageState
      ? {
          cookies: storageState.cookies.length,
          localStorageOrigins: storageState.origins.length,
        }
      : null,
    routeCount: routes.length,
    captures: [],
    errors: [],
  };

  const jobs = buildJobs(routes, options);
  const preskipped = routes.filter((entry) => entry.skip);
  const usedFiles = new Set();
  const failureDetails = [];

  let ok = 0;
  let skipped = 0;
  let failures = 0;

  for (const entry of preskipped) {
    manifest.captures.push(makePreskippedRecord(entry, options));
    skipped += 1;
  }

  for (let index = 0; index < jobs.length; index += 1) {
    const job = jobs[index];
    const { entry, viewport, kind } = job;
    const url = resolveUrl(options.baseUrl, entry.route);
    const file = uniqueFileName(entry, viewport.mobile, usedFiles);
    const filePath = join(outDir, file);
    const record = makeRecord({
      entry,
      viewport,
      file,
      fullPage: job.fullPage,
      element: job.element,
      url,
    });
    const startedForCapture = Date.now();
    const label = `${entry.route} (${kind} ${viewport.width}x${viewport.height})`;

    await rm(filePath, { force: true }).catch(() => undefined);
    process.stdout.write(`[${index + 1}/${jobs.length}] ${label} ... `);

    try {
      const result = await captureOne({
        cdp,
        page,
        entry,
        viewport,
        waitMs: job.waitMs,
        fullPage: job.fullPage,
        element: job.element,
        dismiss: job.dismiss,
        options,
      });

      record.status = result.status;
      record.httpStatus = result.httpStatus ?? null;
      record.warnings = result.warnings;
      record.errors = result.errors;

      if (result.buffer) {
        await writeFileAtomic(filePath, result.buffer);
        const dimensions = pngDimensions(result.buffer);
        record.file = file;
        record.image = { ...dimensions, bytes: result.buffer.length };
      }

      if (result.status === "skipped") {
        record.file = null;
        skipped += 1;
      } else if (result.status === "ok") {
        ok += 1;
      } else {
        failures += 1;
        record.file = record.image ? file : null;
        const message = result.errors[0] || "Capture failed.";
        failureDetails.push({ label, error: message });
        manifest.errors.push({
          route: entry.route,
          url,
          viewport,
          message,
        });
      }
    } catch (error) {
      failures += 1;
      record.status = "error";
      record.errors.push(error.message);
      record.file = null;
      failureDetails.push({ label, error: error.message });
      manifest.errors.push({
        route: entry.route,
        url,
        viewport,
        message: error.message,
      });
      await rm(filePath, { force: true }).catch(() => undefined);
    } finally {
      record.durationMs = Date.now() - startedForCapture;
      record.capturedAt = new Date().toISOString();
      manifest.captures.push(record);
      await writeManifest(manifest, outDir);
    }

    printResult(record);
  }

  const finishedAt = Date.now();
  manifest.finishedAt = new Date(finishedAt).toISOString();
  await writeManifest(manifest, outDir);

  const summary = {
    ok,
    skipped,
    failures,
    failureDetails,
    startedAt,
    finishedAt,
  };
  printSummary(summary, outDir);
  return summary;
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

async function main() {
  const options = parseCli(process.argv.slice(2));
  if (options.help) {
    printUsage(process.stdout);
    return;
  }
  validateOptions(options);

  if (typeof WebSocket !== "function") {
    throw new Error(
      "This script requires Node.js 22+ because it uses the global WebSocket client.",
    );
  }

  const routes = await loadRoutes(options.routes, options.only);
  const storageState = options.storageState
    ? await loadStorageState(options.storageState)
    : null;

  const outDir = resolve(options.out);
  await mkdir(outDir, { recursive: true });
  const probePath = join(outDir, ".capture-write-test");
  try {
    await writeFile(probePath, "");
    await rm(probePath, { force: true });
  } catch (error) {
    throw new Error(`Output directory ${outDir} is not writable: ${error.message}`);
  }

  if (!existsSync(options.chrome)) {
    throw new Error(
      `Chrome executable not found at ${options.chrome}. Set CHROME_BIN or use --chrome.`,
    );
  }

  console.log("Screenshot capture");
  console.log(`  base URL    ${options.baseUrl}`);
  console.log(`  output      ${outDir}`);
  console.log(`  chrome      ${options.chrome}`);
  console.log(
    `  routes      ${routes.length}${options.only ? ` (filtered by --only=${options.only})` : ""}`,
  );
  console.log(
    `  viewport    ${options.width}x${options.height}${options.mobile ? ` + mobile ${MOBILE_WIDTH}x${MOBILE_HEIGHT}` : ""} @${options.scale}x, ${options.fullPage ? "full page" : "viewport"}`,
  );
  console.log(
    `  state       dark${options.reducedMotion ? ", reduced motion" : ""}${options.element ? `, element ${options.element}` : ""}`,
  );
  if (storageState) {
    console.log(
      `  auth state  ${storageState.cookies.length} cookie(s), ${storageState.origins.length} localStorage origin(s)`,
    );
  }
  console.log("");

  let chrome = null;
  let cdp = null;
  let page = null;

  try {
    chrome = await launchChrome(options);
    cleanupState.chrome = chrome;
    cleanupState.profileDir = chrome.profileDir;

    if (options.verbose) {
      console.log(`  devtools    ${chrome.wsUrl}`);
      console.log(`  profile     ${chrome.profileDir}`);
      console.log("");
    }

    cdp = new CdpConnection(chrome.wsUrl, options.timeout);
    cleanupState.cdp = cdp;
    await cdp.open(15000);

    page = await createPage(cdp);
    await applyStorageState(cdp, page.sessionId, storageState);

    const summary = await runCaptures({
      cdp,
      page,
      options,
      routes,
      outDir,
      storageState,
    });

    process.exitCode = summary.failures > 0 ? 1 : 0;
  } finally {
    if (page && cdp && !cdp.closed) {
      try {
        await cdp.send(
          "Target.closeTarget",
          { targetId: page.targetId },
          undefined,
          5000,
        );
      } catch {
        // The browser may already be closing.
      }
    }
    await cleanupRun();
  }
}

for (const [signal, exitCode] of [
  ["SIGINT", 130],
  ["SIGTERM", 143],
]) {
  process.once(signal, () => {
    console.error(`\nReceived ${signal}; cleaning up Chrome...`);
    cleanupRun().finally(() => process.exit(exitCode));
  });
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  if (error.isUsageError) {
    console.error("Run with --help for usage.");
  }
  process.exitCode = 2;
  cleanupRun().catch(() => undefined);
});
