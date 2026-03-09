#!/usr/bin/env node

const { chromium, firefox } = require("playwright");

async function launchBrowser() {
  const preferred = (process.env.PI_WEB_BROWSER_ORDER || "firefox,chromium")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  let lastError;
  for (const browserName of preferred) {
    try {
      if (browserName === "firefox") {
        return await firefox.launch({ headless: process.env.PI_BROWSER_HEADLESS !== "0" });
      }
      if (browserName === "chromium") {
        return await chromium.launch({
          headless: process.env.PI_BROWSER_HEADLESS !== "0",
          args: ["--no-sandbox", "--disable-dev-shm-usage"],
        });
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("No supported browser could be launched");
}

function usage() {
  console.error("Usage: nav <url> [--wait-ms <ms>] [--timeout-ms <ms>]");
}

function parseArgs(argv) {
  const args = [...argv];
  if (args.length === 0) {
    usage();
    process.exit(2);
  }
  const url = args.shift();
  let waitMs = 0;
  let timeoutMs = 60000;
  while (args.length > 0) {
    const flag = args.shift();
    if (flag === "--wait-ms") {
      waitMs = Number(args.shift() || "0");
      continue;
    }
    if (flag === "--timeout-ms") {
      timeoutMs = Number(args.shift() || "60000");
      continue;
    }
    throw new Error(`Unknown flag: ${flag}`);
  }
  return { url, waitMs, timeoutMs };
}

(async () => {
  let browser;
  try {
    const { url, waitMs, timeoutMs } = parseArgs(process.argv.slice(2));
    const startedAt = Date.now();
    browser = await launchBrowser();
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    if (waitMs > 0) {
      await page.waitForTimeout(waitMs);
    }
    const result = {
      ok: true,
      requested_url: url,
      final_url: page.url(),
      title: await page.title(),
      load_ms: Date.now() - startedAt,
    };
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          error: err && err.message ? err.message : String(err),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
