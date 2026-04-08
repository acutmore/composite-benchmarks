import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BASE_JS = path.join(SCRIPT_DIR, "wider-composites.js");
const RESULTS_DIR = path.join(SCRIPT_DIR, "results");
const OUTPUT_JSON = path.join(RESULTS_DIR, "json-custom-width100-rerun.json");
const GENERATED_JS = path.join(
  SCRIPT_DIR,
  "generated-json-custom-fill-set-reads.js",
);

const D8 =
  "/Users/sonukapoor/projects/v8-work/v8-composites-intern/out/x64.release/d8";

const WIDTH = 100;
const D = 88;
const N_VALUES = [9, 10];
const WARMUP = 3;
const RUNS = 8;

function makeVariant(source, technique, testCase) {
  const replacement = `  var technique; // uncomment below to select
  // technique = "json";
  // technique = "json-custom";
  // technique = "bespoke-js";
  // technique = "native";
  // technique = "polyfill";
  // technique = "polyfill-interned";
  technique = "${technique}";
  // ===============================
  var testCase; // uncomment below to select
  // testCase = "creation";
  // testCase = "fill-set";
  // testCase = "fill-set-reads";
  testCase = "${testCase}";
  // ===============================`;

  const pattern =
    /  var technique;[\s\S]*?  \/\/ ===============================\n  var testCase;[\s\S]*?  \/\/ ===============================/;

  const out = source.replace(pattern, replacement);
  if (out === source) {
    throw new Error("Failed to replace config block");
  }
  return out;
}

function runOne(n, exportPath) {
  const command = `${D8} ${GENERATED_JS} -- ${WIDTH} ${D} ${n}`;

  try {
    execFileSync(
      "hyperfine",
      [
        "--warmup",
        String(WARMUP),
        "--runs",
        String(RUNS),
        "--export-json",
        exportPath,
        command,
      ],
      {
        cwd: SCRIPT_DIR,
        stdio: "pipe",
        encoding: "utf8",
      },
    );
  } catch (error) {
    const stderr = typeof error.stderr === "string" ? error.stderr.trim() : "";
    const stdout = typeof error.stdout === "string" ? error.stdout.trim() : "";
    const details = [stderr, stdout].filter(Boolean).join("\n");
    throw new Error(
      details
        ? `hyperfine failed for n=${n}\n${details}`
        : `hyperfine failed for n=${n}`,
    );
  }

  return JSON.parse(readFileSync(exportPath, "utf8")).results[0];
}

function main() {
  mkdirSync(RESULTS_DIR, { recursive: true });

  const base = readFileSync(BASE_JS, "utf8");
  const generated = makeVariant(base, "json-custom", "fill-set-reads");
  writeFileSync(GENERATED_JS, generated, "utf8");

  try {
    const results = [];
    for (const n of N_VALUES) {
      const exportPath = path.join(
        RESULTS_DIR,
        `fill-set-reads-json-custom-w${WIDTH}-n${n}.rerun.hyperfine.json`,
      );
      const result = runOne(n, exportPath);
      results.push({
        width: WIDTH,
        d: D,
        n,
        mean_seconds: result.mean,
        stddev_seconds: result.stddev,
        median_seconds: result.median,
        min_seconds: result.min,
        max_seconds: result.max,
        runs: result.times.length,
        command: result.command,
        export_json: exportPath,
      });
    }

    writeFileSync(
      OUTPUT_JSON,
      JSON.stringify(
        {
          benchmark: "wider-composites-json-custom-rerun",
          generated_at: new Date().toISOString(),
          config: {
            width: WIDTH,
            d: D,
            nValues: N_VALUES,
            warmup: WARMUP,
            runs: RUNS,
            d8: D8,
          },
          results,
        },
        null,
        2,
      ),
      "utf8",
    );

    console.log(`Saved rerun data to ${OUTPUT_JSON}`);
  } finally {
    rmSync(GENERATED_JS, { force: true });
  }
}

main();
