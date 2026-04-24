import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(SCRIPT_DIR, "results");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "native-retained-hit-analysis.json");

// Override with D8=/path/to/d8 environment variable.
const D8 = process.env.D8 ?? "d8";

const DEFAULT_WIDTHS = [100];
const D = 40;
const N = 3;

function parseWidths(argv) {
  const widths = argv
    .flatMap((v) => v.split(","))
    .map((v) => Number.parseInt(v, 10))
    .filter((v) => Number.isFinite(v));
  return widths.length > 0 ? widths : DEFAULT_WIDTHS;
}

// Generates a self-contained d8 script that:
//   1. Builds composite keys once.
//   2. Inserts them into a Set once.
//   3. Repeatedly probes the same retained keys via Set.has().
//   4. Prints JSON stats to stdout via print().
function makeInnerScript(width, d, n) {
  return `
(function() {
  "use strict";

  const width = ${width};
  const D = ${d};
  const N = ${n};
  const offset = Number.MAX_SAFE_INTEGER - D;

  function buildObj(w) {
    const obj = { a: 0, b: 0, c: 0 };
    for (let i = 3; i < w; i++) {
      obj["p" + i] = "fixed-string-value-" + i;
    }
    return obj;
  }

  function buildKeys(w) {
    const obj = buildObj(w);
    const keys = [];

    for (let a = 0; a < D; a++) {
      obj.a = offset + a;
      for (let b = 0; b < D; b++) {
        obj.b = offset + b;
        for (let c = 0; c < D; c++) {
          obj.c = offset + c;
          keys.push(new Composite(obj));
        }
      }
    }

    return keys;
  }

  const keys = buildKeys(width);
  const set = new Set();

  // Warmup / construction phase.
  for (let i = 0; i < keys.length; i++) {
    set.add(keys[i]);
  }
  for (let r = 0; r < N; r++) {
    for (let i = 0; i < keys.length; i++) {
      set.has(keys[i]);
    }
  }

  // Discard stats from warmup/setup.
  %CompositeStats();

  let hits = 0;

  // Measured retained-hit phase.
  for (let r = 0; r < N; r++) {
    for (let i = 0; i < keys.length; i++) {
      if (set.has(keys[i])) {
        hits++;
      }
    }
  }

  const raw = %CompositeStats();
  raw.hits = hits;
  raw.totalKeys = keys.length;
  raw.readPasses = N;

  print(JSON.stringify(raw));
})();
`;
}

function runNativeAnalysis(width, d, n) {
  const script = makeInnerScript(width, d, n);
  const tmpFile = path.join(tmpdir(), `composite-retained-hit-${width}-${d}-${n}.js`);

  try {
    writeFileSync(tmpFile, script, "utf8");
    const stdout = execFileSync(D8, ["--allow-natives-syntax", tmpFile], {
      encoding: "utf8",
    }).trim();

    const raw = JSON.parse(stdout);

    return {
      width,
      total_keys: raw.totalKeys,
      read_passes: raw.readPasses,
      hits: raw.hits,
      collision_insertions: raw.collisionInsertions,
      collision_rate:
        raw.totalInsertions > 0 ? raw.collisionInsertions / raw.totalInsertions : 0,
      max_bucket_size: raw.maxBucketSize,
      total_equality_checks: raw.totalEqualityChecks,
      total_insertions: raw.totalInsertions,
    };
  } finally {
    rmSync(tmpFile, { force: true });
  }
}

function main() {
  const widths = parseWidths(process.argv.slice(2));
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const output = {
    benchmark: "native-retained-hit-analysis",
    generated_at: new Date().toISOString(),
    config: { d: D, n: N, widths },
    implementations: {
      native: widths.map((w) => runNativeAnalysis(w, D, N)),
    },
  };

  writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2), "utf8");

  for (const row of output.implementations.native) {
    console.log(
      [
        `width=${row.width}`,
        `total_keys=${row.total_keys}`,
        `read_passes=${row.read_passes}`,
        `hits=${row.hits}`,
        `collision_rate=${(row.collision_rate * 100).toFixed(4)}%`,
        `collision_insertions=${row.collision_insertions}`,
        `max_bucket_size=${row.max_bucket_size}`,
        `total_equality_checks=${row.total_equality_checks}`,
        `total_insertions=${row.total_insertions}`,
      ].join(" ")
    );
  }

  console.log(`\nSaved to ${OUTPUT_JSON}`);
}

main();