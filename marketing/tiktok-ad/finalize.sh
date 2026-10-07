#!/usr/bin/env bash
# 60fps render + soundtrack -> final deliverables
#  - 4K (2160x3840) 60fps, H.264 + AAC
#  - 1080x1920 60fps version (smaller upload)
#  - 4K silent version (to add a trending TikTok sound in-app)
set -euo pipefail
BUILD=$1; OUT=$2; mkdir -p "$OUT"
ffmpeg -y -loglevel error -i "$BUILD/video.mp4" -i "$BUILD/soundtrack.wav" -r 60 \
  -c:v libx264 -preset slow -crf 14 -profile:v high -level 5.2 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 320k -af "loudnorm=I=-14:TP=-1:LRA=7" -ar 48000 -shortest -movflags +faststart "$OUT/StudioOS_TikTok_4K_60fps.mp4"
ffmpeg -y -loglevel error -i "$OUT/StudioOS_TikTok_4K_60fps.mp4" -vf "scale=1080:1920:flags=lanczos" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUT/StudioOS_TikTok_1080p_60fps.mp4"
ffmpeg -y -loglevel error -i "$OUT/StudioOS_TikTok_4K_60fps.mp4" -an -c:v copy -movflags +faststart "$OUT/StudioOS_TikTok_4K_60fps_ohne_Ton.mp4"
ls -la "$OUT"
