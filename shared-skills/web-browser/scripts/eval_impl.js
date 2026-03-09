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
  console.error("Usage: eval <url> <javascript-expression> [--timeout-ms <ms>]");
}

function parseArgs(argv) {
  const args = [...argv];
  if (args.length < 2) {
    usage();
    process.exit(2);
  }
  const url = args.shift();
  let timeoutMs = 60000;
  const expressionParts = [];

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--timeout-ms") {
      timeoutMs = Number(args.shift() || "60000");
      continue;
    }
    expressionParts.push(token);
  }

  if (expressionParts.length === 0) {
    usage();
    process.exit(2);
  }

  return { url, expression: expressionParts.join(" "), timeoutMs };
}

(async () => {
  let browser;
  try {
    const { url, expression, timeoutMs } = parseArgs(process.argv.slice(2));
    browser = await launchBrowser();
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    const value = await page.evaluate((expr) => {
      // eslint-disable-next-line no-eval
      return (0, eval)(expr);
    }, expression);
    console.log(
      JSON.stringify(
        {
          ok: true,
          requested_url: url,
          final_url: page.url(),
          expression,
          value,
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
