#!/usr/bin/env bash
# PNG app icons from the ring-knot SVGs (run build-knot-icons.mjs first).
# macOS: Quick Look renders the SVG, ImageMagick sizes it.
#   bash scripts/build-knot-icons-png.sh
set -euo pipefail
cd "$(dirname "$0")/.."
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

for mode in light dark; do
  qlmanage -t -s 1024 -o "$tmp" "public/icons/knot-ring-$mode.svg" >/dev/null 2>&1
  src="$tmp/knot-ring-$mode.svg.png"
  for size in 180 192 512; do
    magick "$src" -resize "${size}x${size}" -strip "public/icons/knot-ring-$mode-$size.png"
  done
done
echo "build-knot-icons-png: light and dark at 180, 192 and 512 in public/icons/"
