#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
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
  console.error("Usage: screenshot <url> [output-path] [--timeout-ms <ms>]");
}

function parseArgs(argv) {
  const args = [...argv];
  if (args.length < 1) {
    usage();
    process.exit(2);
  }
  const url = args.shift();
  let outputPath = "";
  let timeoutMs = 60000;
  while (args.length > 0) {
    const token = args.shift();
    if (token === "--timeout-ms") {
      timeoutMs = Number(args.shift() || "60000");
      continue;
    }
    if (!outputPath) {
      outputPath = token;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }
  if (!outputPath) {
    outputPath = `/tmp/pi-browser-${Date.now()}.png`;
  }
  return { url, outputPath, timeoutMs };
}

(async () => {
  let browser;
  try {
    const { url, outputPath, timeoutMs } = parseArgs(process.argv.slice(2));
    browser = await launchBrowser();
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.screenshot({ path: outputPath, fullPage: true });
    const stats = fs.statSync(outputPath);
    console.log(
      JSON.stringify(
        {
          ok: true,
          requested_url: url,
          final_url: page.url(),
          title: await page.title(),
          screenshot_path: path.resolve(outputPath),
          bytes: stats.size,
        },
        null,
        2,
      ),
    );
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
