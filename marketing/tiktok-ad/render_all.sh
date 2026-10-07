#!/usr/bin/env bash
# Renders the ad as native 4K (2160x3840) 60 fps in parallel chunks and joins them losslessly.
# Usage: ./render_all.sh <build-dir>
set -euo pipefail
cd "$(dirname "$0")"
OUT=$(realpath -m "${1:-build}"); mkdir -p "$OUT"
CUTS=(0 1 2 3 5 7 9 11 13 15 17.5 20 24)   # shorter chunks where the scene is blur-heavy
JOBS=()
for i in $(seq 0 $((${#CUTS[@]} - 2))); do JOBS+=("$i ${CUTS[$i]} ${CUTS[$((i+1))]}"); done
printf '%s\n' "${JOBS[@]}" | xargs -P 4 -L 1 bash -c 'node render.mjs "'"$OUT"'/part$0.mp4" --fps 60 --scale 2 --from $1 --to $2 --crf 10 --preset medium 2> "'"$OUT"'/log$0.txt"'
for i in $(seq 0 $((${#CUTS[@]} - 2))); do echo "file 'part$i.mp4'"; done > "$OUT/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$OUT/list.txt" -c copy "$OUT/video.mp4"
echo DONE
