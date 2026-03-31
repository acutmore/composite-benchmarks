#!/usr/bin/env bash
cd "$(dirname "$0")"
hyperfine \
  "d8 ./wider-composites.js -- 5 50 1" \
  "d8 ./wider-composites.js -- 20 50 1" \
  "d8 ./wider-composites.js -- 50 50 1" \
  "d8 ./wider-composites.js -- 100 50 1"