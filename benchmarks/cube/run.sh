#!/usr/bin/env bash
cd "$(dirname "$0")"

hyperfine \
  "d8 ./cube.js -- 70  1" \
  "d8 ./cube.js -- 88  1" \
  "d8 ./cube.js -- 111 1"
