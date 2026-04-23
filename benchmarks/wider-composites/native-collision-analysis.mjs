import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(SCRIPT_DIR, "results");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "native-collision-analysis.json");

// Override with D8=/path/to/d8 environment variable.
const D8 = process.env.D8 ?? "d8";

const DEFAULT_WIDTHS = [100];
const D = 88;

function parseWidths(argv) {
  const widths = argv
    .flatMap((v) => v.split(","))
    .map((v) => Number.parseInt(v, 10))
    .filter((v) => Number.isFinite(v));
  return widths.length > 0 ? widths : DEFAULT_WIDTHS;
}

// Generates a self-contained d8 script that:
//   1. Runs one warmup pass (stats discarded).
//   2. Runs one measured pass.
//   3. Prints JSON stats to stdout via print().
function makeInnerScript(width, d) {
  return `
(function() {
  "use strict";

  const width = ${width};
  const D = ${d};
  const offset = Number.MAX_SAFE_INTEGER - D;

  function buildObj(w) {
    const obj = { a: 0, b: 0, c: 0 };
    for (let i = 3; i < w; i++) {
      obj["p" + i] = "fixed-string-value-" + i;
    }
    return obj;
  }

  function runLoop(obj) {
    for (let a = 0; a < D; a++) {
      obj.a = offset + a;
      for (let b = 0; b < D; b++) {
        obj.b = offset + b;
        for (let c = 0; c < D; c++) {
          obj.c = offset + c;
          new Composite(obj);
        }
      }
    }
  }

  const obj = buildObj(width);

  // Warmup pass — discard stats.
  runLoop(obj);
  %CompositeStats();

  // Measured pass.
  runLoop(obj);
  print(JSON.stringify(%CompositeStats()));
})();
`;
}

function runNativeAnalysis(width, d) {
  const script = makeInnerScript(width, d);
  const tmpFile = path.join(tmpdir(), `composite-inner-${width}-${d}.js`);

  try {
    writeFileSync(tmpFile, script, "utf8");
    const stdout = execFileSync(D8, ["--allow-natives-syntax", tmpFile], {
      encoding: "utf8",
    }).trim();

    const raw = JSON.parse(stdout);
    const totalKeys = raw.totalInsertions;

    return {
      width,
      total_keys: totalKeys,
      collision_insertions: raw.collisionInsertions,
      collision_rate: totalKeys > 0 ? raw.collisionInsertions / totalKeys : 0,
      max_bucket_size: raw.maxBucketSize,
      total_equality_checks: raw.totalEqualityChecks,
    };
  } finally {
    rmSync(tmpFile, { force: true });
  }
}

function main() {
  const widths = parseWidths(process.argv.slice(2));
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const output = {
    benchmark: "native-collision-analysis",
    generated_at: new Date().toISOString(),
    config: { d: D, widths },
    implementations: {
      native: widths.map((w) => runNativeAnalysis(w, D)),
    },
  };

  writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2), "utf8");

  for (const row of output.implementations.native) {
    console.log(
      [
        `width=${row.width}`,
        `collision_rate=${(row.collision_rate * 100).toFixed(4)}%`,
        `collision_insertions=${row.collision_insertions}`,
        `max_bucket_size=${row.max_bucket_size}`,
        `total_equality_checks=${row.total_equality_checks}`,
      ].join(" ")
    );
  }

  console.log(`\nSaved to ${OUTPUT_JSON}`);
}

main();