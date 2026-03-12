#!/usr/bin/env bash
set -euo pipefail

# parse_monetization.sh
# Lightweight shell utility to extract a structured, human-friendly view
# from a Markdown monetization strategy document.
###
# Usage:
#   ./scripts/parse_monetization.sh path/to/monetization.md
###
# Output:
#   A sectioned dump with headings replicated as "== <Section> ==" markers,
#   followed by the section content. Also prints a quick list of notable cost lines.
md="$1"
if [[ -z "${md:-}" ]]; then
  echo "Usage: $0 <markdown-file>"
  exit 2
fi
if [[ ! -f "$md" ]]; then
  echo "Error: File '$md' not found."
  exit 1
fi

echo "Monetization Strategy (sections from: $md)"
echo

# Emit sections delineated by level-2/level-3 headers
awk '
  BEGIN {sec=""}
  /^#{2,} / {
    # Normalize header text
    header=$0
    sub(/^#{2,}[ \t]*/, "", header)
    if (sec!="") print ""
    sec=header
    print "=== " sec " ==="
    next
  }
  {
    if (sec!="") print $0
  }
'' "$md"
echo

# Quick cost-line hints
echo "=== Notable cost lines (quick skim) ==="
grep -iE "Monthly Cost|Est\\. Monthly Cost|USD|GHS" "$md" || true
echo
