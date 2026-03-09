---
name: web-browser
description: "Linux-safe browser checks for Nebari Pi pods using Playwright (navigate, evaluate JS, click selectors, capture screenshots)."
license: Internal
---

# Web Browser

This skill runs headless Playwright browsers inside a Nebari user pod.

## Commands

```bash
./scripts/nav https://example.com
./scripts/eval https://example.com 'document.title'
./scripts/click https://example.com 'button[type="submit"]' --wait-ms 1500
./scripts/screenshot https://example.com
```

## Notes

- Scripts auto-install Firefox via Playwright on first use.
- Use CSS selectors for `click`.
- Set `PI_WEB_BROWSER_SKIP_INSTALL=1` to skip install attempts.
- Override browser order with `PI_WEB_BROWSER_ORDER` (default: `firefox,chromium`).
