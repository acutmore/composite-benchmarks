#!/usr/bin/env bash
cd "$(dirname "$0")"

hyperfine \
  "d8 ./wider-composites.js -- 6 1" \
  "d8 ./wider-composites.js -- 8 1" \
  "d8 ./wider-composites.js -- 10 1"