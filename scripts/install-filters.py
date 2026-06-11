#!/usr/bin/env python3
"""
install-filters.py
------------------
Idempotent installer that adds the Holbrook left-rail filter components to
every tire and wheel page in the site.

What it does for each target page:
  1. Checks if the filter script tags are already present (marker comment
     "<!-- holbrook-filters: installed -->"). If yes, skips.
  2. Inserts the core + category filter <script> tags immediately before
     </body>.

Usage:
    python3 install-filters.py \
        --root /path/to/holbrook-complete-deploy

Optional flags:
    --dry-run      Show what would change without writing files.
    --uninstall    Remove the filter script tags + marker (reverses step 2).
    --only tires   Process only tires/ (or --only wheels).
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import time
from pathlib import Path
from typing import Iterable


def _read_with_retry(path: Path, attempts: int = 3, base_delay: float = 0.25) -> str:
    """Some network / FUSE mounts occasionally raise EDEADLK (errno 35).
    Retry briefly before giving up so the script never blocks a run."""
    last_err: Exception | None = None
    for i in range(attempts):
        try:
            return path.read_text(encoding="utf-8")
        except OSError as e:
            if getattr(e, "errno", None) != 35:
                raise
            last_err = e
            time.sleep(base_delay * (2 ** i))
    assert last_err is not None
    raise last_err


def _write_with_retry(path: Path, data: str, attempts: int = 3, base_delay: float = 0.25) -> None:
    last_err: Exception | None = None
    for i in range(attempts):
        try:
            path.write_text(data, encoding="utf-8")
            return
        except OSError as e:
            if getattr(e, "errno", None) != 35:
                raise
            last_err = e
            time.sleep(base_delay * (2 ** i))
    assert last_err is not None
    raise last_err

MARKER = "<!-- holbrook-filters: installed -->"
END_MARKER = "<!-- /holbrook-filters -->"

TIRE_SNIPPET = f"""{MARKER}
<script src="/js/holbrook-filters-core.js" defer></script>
<script src="/js/tire-filters.js" defer></script>
{END_MARKER}"""

WHEEL_SNIPPET = f"""{MARKER}
<script src="/js/holbrook-filters-core.js" defer></script>
<script src="/js/wheel-filters.js" defer></script>
{END_MARKER}"""


def iter_html_files(root: Path, category: str) -> Iterable[Path]:
    """Yield every .html file inside <root>/<category>/ recursively."""
    cat_root = root / category
    if not cat_root.is_dir():
        return
    for dirpath, _, filenames in os.walk(cat_root):
        for fname in filenames:
            if fname.endswith(".html"):
                yield Path(dirpath) / fname


def already_installed(html: str) -> bool:
    return MARKER in html


def inject(html: str, snippet: str) -> str:
    """Insert snippet immediately before the closing </body> tag.

    Falls back to appending at the end if </body> is missing (malformed)."""
    if already_installed(html):
        return html
    # Case-insensitive match on </body>; preserve original casing by using
    # the matched group for replacement.
    m = re.search(r"</body\s*>", html, flags=re.IGNORECASE)
    if m:
        return html[: m.start()] + snippet + "\n" + html[m.start():]
    return html + "\n" + snippet + "\n"


def remove(html: str) -> str:
    """Remove a previously installed block bounded by MARKER/END_MARKER."""
    pattern = re.compile(
        re.escape(MARKER) + r".*?" + re.escape(END_MARKER) + r"\s*",
        flags=re.DOTALL,
    )
    return pattern.sub("", html)


def process_file(path: Path, snippet: str, *, dry_run: bool, uninstall: bool) -> str:
    try:
        original = _read_with_retry(path)
    except UnicodeDecodeError:
        return f"SKIP  (non-utf8) {path}"
    except OSError as e:
        return f"ERROR (read failed: {e}) {path}"

    if uninstall:
        if MARKER not in original:
            return f"SKIP  (nothing to remove) {path}"
        updated = remove(original)
        action = "REMOVE"
    else:
        if already_installed(original):
            return f"SKIP  (already installed) {path}"
        updated = inject(original, snippet)
        action = "INSTALL"

    if updated == original:
        return f"SKIP  (no change) {path}"

    if dry_run:
        return f"{action} (dry-run) {path}"

    try:
        _write_with_retry(path, updated)
    except OSError as e:
        return f"ERROR (write failed: {e}) {path}"
    return f"{action} {path}"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", required=True, type=Path, help="Path to holbrook-complete-deploy")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--uninstall", action="store_true", help="Remove filter script tags")
    ap.add_argument("--only", choices=["tires", "wheels", "both"], default="both")
    args = ap.parse_args()

    root: Path = args.root.resolve()
    if not root.is_dir():
        print(f"ERROR: --root does not exist: {root}", file=sys.stderr)
        return 2

    jobs = []
    if args.only in ("tires", "both"):
        jobs.append(("tires", TIRE_SNIPPET))
    if args.only in ("wheels", "both"):
        jobs.append(("wheels", WHEEL_SNIPPET))

    totals = {"installed": 0, "skipped": 0, "removed": 0}
    for category, snippet in jobs:
        print(f"\n=== {category.upper()} ===")
        count = 0
        for html_path in iter_html_files(root, category):
            count += 1
            msg = process_file(
                html_path,
                snippet,
                dry_run=args.dry_run,
                uninstall=args.uninstall,
            )
            print(msg)
            if msg.startswith("INSTALL"):
                totals["installed"] += 1
            elif msg.startswith("REMOVE"):
                totals["removed"] += 1
            else:
                totals["skipped"] += 1
        if count == 0:
            print(f"(no html files found under {root / category})")

    print("\nDONE")
    for k, v in totals.items():
        print(f"  {k:>10}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
