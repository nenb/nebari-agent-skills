#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is required" >&2
  exit 2
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: npx is required" >&2
  exit 2
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is required" >&2
  exit 2
fi

RUNTIME_DIR="${PI_WEB_BROWSER_RUNTIME_DIR:-$HOME/.cache/pi-web-browser/runtime}"
PLAYWRIGHT_BIN="$RUNTIME_DIR/node_modules/.bin/playwright"

if [[ ! -x "$PLAYWRIGHT_BIN" ]]; then
  mkdir -p "$RUNTIME_DIR"
  if [[ ! -f "$RUNTIME_DIR/package.json" ]]; then
    cat > "$RUNTIME_DIR/package.json" <<'JSON'
{
  "name": "pi-web-browser-runtime",
  "private": true
}
JSON
  fi
  npm --prefix "$RUNTIME_DIR" install --silent playwright >/dev/null
fi

if [[ "${PI_WEB_BROWSER_SKIP_INSTALL:-0}" != "1" ]]; then
  INSTALL_BROWSERS="${PI_WEB_BROWSER_INSTALL_BROWSERS:-firefox}"
  IFS=',' read -r -a browser_list <<< "$INSTALL_BROWSERS"
  for browser_name in "${browser_list[@]}"; do
    browser_name="$(echo "$browser_name" | tr -d '[:space:]')"
    [[ -n "$browser_name" ]] || continue
    marker="$RUNTIME_DIR/.installed-${browser_name}"
    if [[ -f "$marker" ]]; then
      continue
    fi
    "$PLAYWRIGHT_BIN" install "$browser_name" >/dev/null
    touch "$marker"
  done
fi

if [[ -n "${NODE_PATH:-}" ]]; then
  export NODE_PATH="$RUNTIME_DIR/node_modules:$NODE_PATH"
else
  export NODE_PATH="$RUNTIME_DIR/node_modules"
fi

exec node "$@"
