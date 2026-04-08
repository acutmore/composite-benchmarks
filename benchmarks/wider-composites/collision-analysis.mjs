import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

const SCRIPT_DIR = path.resolve("benchmarks/wider-composites");
const OUTPUT_DIR = path.join(SCRIPT_DIR, "results");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "wider-composites-collision-analysis.json");

const DEFAULT_WIDTHS = [100];
const D = 88;

const POLYFILL_PATH = path.resolve("reference-implementations/polyfill.js");
const INTERNED_POLYFILL_PATH = path.resolve(
  "reference-implementations/polyfill-interned.js",
);

function parseWidths(argv) {
  const widths = argv
    .flatMap((value) => value.split(","))
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value));

  return widths.length > 0 ? widths : DEFAULT_WIDTHS;
}

function createContext() {
  const context = {
    console,
    Array,
    Error,
    FinalizationRegistry,
    JSON,
    Map,
    Math,
    Number,
    Object,
    Reflect,
    Set,
    String,
    Symbol,
    TypeError,
    WeakMap,
    WeakRef,
  };
  context.globalThis = context;
  return vm.createContext(context);
}

function runInIsolatedContext(sourcePath, analysisSource) {
  const polyfillSource = readFileSync(sourcePath, "utf8");
  const context = createContext();

  vm.runInContext(polyfillSource, context, { filename: sourcePath });
  const json = vm.runInContext(analysisSource, context);
  return JSON.parse(json);
}

function makeSummary(stats, totalKeys) {
  return {
    total_keys: totalKeys,
    collision_insertions: stats.collisionInsertions,
    collision_rate: stats.collisionInsertions / totalKeys,
    max_bucket_size: stats.maxBucketSize,
  };
}

function analyzeImplementation(sourcePath, width, d) {
  const totalKeys = d ** 3;
  const analysisSource = `
    (() => {
      const offset = Number.MAX_SAFE_INTEGER - ${d};
      const obj = { a: 0, b: 0, c: 0 };
      const seen = new Map();
      let collisionInsertions = 0;
      let maxBucketSize = 0;

      for (let i = 3; i < ${width}; i++) {
        obj["p" + i] = "fixed-string-value-" + i;
      }

      for (let a = 0; a < ${d}; a++) {
        obj.a = offset + a;
        for (let b = 0; b < ${d}; b++) {
          obj.b = offset + b;
          for (let c = 0; c < ${d}; c++) {
            obj.c = offset + c;
            const hash = compositePolyfill.debugHashPlainObject(obj);
            const nextCount = (seen.get(hash) ?? 0) + 1;
            seen.set(hash, nextCount);
            if (nextCount > 1) {
              collisionInsertions++;
            }
            if (nextCount > maxBucketSize) {
              maxBucketSize = nextCount;
            }
          }
        }
      }

      return JSON.stringify({
        uniqueHashes: seen.size,
        collisionInsertions,
        maxBucketSize,
      });
    })();
  `;

  const result = runInIsolatedContext(sourcePath, analysisSource);
  return {
    width,
    unique_hashes: result.uniqueHashes,
    ...makeSummary(result, totalKeys),
  };
}

function main() {
  const widths = parseWidths(process.argv.slice(2));
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const output = {
    benchmark: "wider-composites-collision-analysis",
    generated_at: new Date().toISOString(),
    config: {
      d: D,
      widths,
    },
    implementations: {
      polyfill: widths.map((width) => analyzeImplementation(POLYFILL_PATH, width, D)),
      "polyfill-interned": widths.map((width) =>
        analyzeImplementation(INTERNED_POLYFILL_PATH, width, D),
      ),
    },
  };

  writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2), "utf8");

  for (const [implementation, rows] of Object.entries(output.implementations)) {
    console.log(`\\n${implementation}`);
    for (const row of rows) {
      console.log(
        [
          `width=${row.width}`,
          `collision_rate=${(row.collision_rate * 100).toFixed(4)}%`,
          `collision_insertions=${row.collision_insertions}`,
          `max_bucket_size=${row.max_bucket_size}`,
        ].join(" "),
      );
    }
  }

  console.log(`\\nSaved collision analysis to ${OUTPUT_JSON}`);
}

main();
