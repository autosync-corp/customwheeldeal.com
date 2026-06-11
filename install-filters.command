#!/bin/bash
# install-filters.command
# ----------------------------------------------------------------
# Pure-bash installer for the Holbrook left-rail filter sidebar.
# Adds the required <script> tags before </body> in every tire and
# wheel HTML file. No Python and no awk required - works on every
# macOS out of the box.
#
# Double-click this file to run it. It shows a dry run first, then
# waits for you to press ENTER before making changes.
#
# Safe to re-run - it marks each file with an HTML comment and
# skips files that are already installed.
# ----------------------------------------------------------------

cd "$(dirname "$0")" || exit 1

MARKER_LINE="<!-- holbrook-filters: installed -->"

# Write the snippet for the given category to a file we can read
# line-by-line in bash. Pure bash has no trouble with multi-line
# content this way, unlike BSD awk on macOS.
write_snippet() {
  local js_file="$1"
  local out_file="$2"
  {
    printf '%s\n' "<!-- holbrook-filters: installed -->"
    printf '%s\n' '<script src="/js/holbrook-filters-core.js" defer></script>'
    printf '%s\n' "<script src=\"/js/${js_file}\" defer></script>"
    printf '%s\n' "<!-- /holbrook-filters -->"
  } > "$out_file"
}

# Globals for counters
INSTALLED=0
SKIPPED=0
FAILED=0

# --------- core functions ---------

# already_installed <file>  -> returns 0 if file has the marker
already_installed() {
  grep -q "holbrook-filters: installed" "$1" 2>/dev/null
}

# inject <file> <snippet-file>   -> inserts snippet before the first </body>
# using only bash, grep, tr, and cat. No awk, no sed, no python.
inject() {
  local file="$1"
  local snippet_file="$2"
  local tmp
  tmp="$(mktemp -t holbrookinstall 2>/dev/null || mktemp)" || return 1

  local inserted=0
  # Read the file line by line. `IFS=` and `-r` keep whitespace + backslashes.
  # On the first line containing </body> (case-insensitive), emit the snippet
  # before the line.
  while IFS= read -r line || [ -n "$line" ]; do
    if [ "$inserted" -eq 0 ]; then
      local lc
      lc=$(printf '%s' "$line" | tr '[:upper:]' '[:lower:]')
      case "$lc" in
        *"</body>"*)
          cat "$snippet_file"
          inserted=1
          ;;
      esac
    fi
    printf '%s\n' "$line"
  done < "$file" > "$tmp"

  # Malformed HTML with no </body>? Append the snippet at the end rather
  # than losing it silently.
  if [ "$inserted" -eq 0 ]; then
    cat "$snippet_file" >> "$tmp"
  fi

  # Overwrite the original in place, preserving permissions/mtime semantics
  cat "$tmp" > "$file" || { rm -f "$tmp"; return 1; }
  rm -f "$tmp"
  return 0
}

# process_dir <category> <js_file> <mode>  where mode is "dry" or "real"
process_dir() {
  local cat="$1"
  local js_file="$2"
  local mode="$3"

  if [ ! -d "$cat" ]; then
    echo "  (no $cat/ directory found)"
    return 0
  fi

  local snippet_file
  snippet_file="$(mktemp -t holbrooksnip 2>/dev/null || mktemp)"
  write_snippet "$js_file" "$snippet_file"

  local count=0
  while IFS= read -r -d '' file; do
    count=$((count + 1))
    if already_installed "$file"; then
      SKIPPED=$((SKIPPED + 1))
      if [ "$mode" = "dry" ]; then
        echo "  SKIP (already installed) $file"
      fi
      continue
    fi
    if [ "$mode" = "dry" ]; then
      echo "  INSTALL (dry-run) $file"
      INSTALLED=$((INSTALLED + 1))
    else
      if inject "$file" "$snippet_file"; then
        INSTALLED=$((INSTALLED + 1))
        echo "  INSTALL $file"
      else
        FAILED=$((FAILED + 1))
        echo "  FAIL   $file"
      fi
    fi
  done < <(find "$cat" -type f -name "*.html" -print0)

  rm -f "$snippet_file"
  echo "  ($count files scanned under $cat/)"
}

run_pass() {
  local mode="$1"
  INSTALLED=0
  SKIPPED=0
  FAILED=0

  echo ""
  echo "=== TIRES ==="
  process_dir "tires" "tire-filters.js" "$mode"

  echo ""
  echo "=== WHEELS ==="
  process_dir "wheels" "wheel-filters.js" "$mode"

  echo ""
  echo "==========================================================="
  if [ "$mode" = "dry" ]; then
    echo "  Dry run complete. Nothing has been changed yet."
  else
    echo "  Install complete."
  fi
  echo "  Would-install: $INSTALLED"
  echo "  Already installed (skipped): $SKIPPED"
  [ "$FAILED" -gt 0 ] && echo "  Failed: $FAILED"
  echo "==========================================================="
}

# --------- main ---------

clear
cat <<'BANNER'
===========================================================
  HOLBROOK FILTER INSTALLER  (pure-bash, no Python needed)
  Adds the left-rail filter sidebar to every tire + wheel page.
===========================================================
BANNER

echo ""
echo "Working from: $(pwd)"
echo ""

if [ ! -d "tires" ] && [ ! -d "wheels" ]; then
  echo "ERROR: Neither 'tires/' nor 'wheels/' folder found in:"
  echo "       $(pwd)"
  echo ""
  echo "This installer must live alongside the tires/ and wheels/ folders."
  echo "Move install-filters.command into holbrook-complete-deploy/ and try again."
  echo ""
  echo "Press ENTER to close."
  read -r
  exit 1
fi

if [ ! -f "js/holbrook-filters-core.js" ]; then
  echo "WARNING: js/holbrook-filters-core.js was not found."
  echo "The script tags will still be added, but the sidebar will not render"
  echo "until that file is present. Check the js/ folder."
  echo ""
fi

echo "------- STEP 1: DRY RUN (nothing changed yet) -------"
run_pass "dry"
echo ""
echo "------- STEP 2: CONFIRM -------"
echo ""
if [ "$INSTALLED" -eq 0 ] && [ "$SKIPPED" -gt 0 ]; then
  echo "Everything is already installed. Nothing more to do."
  echo ""
  echo "Press ENTER to close."
  read -r
  exit 0
fi
echo "Press ENTER to install for real."
echo "To cancel, close this window or press Ctrl+C."
read -r

echo ""
echo "------- STEP 3: INSTALL -------"
run_pass "real"

echo ""
echo "Open any tires/{brand}/index.html or wheels/{brand}/index.html"
echo "in your browser - the left-rail filter sidebar will be there."
echo ""
echo "Press ENTER to close this window."
read -r
