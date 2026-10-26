#!/bin/sh
set -eu
VIDEO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
export HYPERFRAMES_NO_TELEMETRY=1
export HYPERFRAMES_FFMPEG_PATH="$VIDEO_ROOT/.hyperframes/bin/ffmpeg"
export HYPERFRAMES_FFPROBE_PATH="$VIDEO_ROOT/.hyperframes/bin/ffprobe"
export HYPERFRAMES_BROWSER_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
cd "$VIDEO_ROOT"
exec node /Users/mmaphutijkgomo/.npm/_npx/702923228c2ce1e6/node_modules/hyperframes/bin/hyperframes.mjs "$@"
