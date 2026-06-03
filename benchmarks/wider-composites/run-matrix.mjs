import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BENCHMARK_JS = path.join(SCRIPT_DIR, "wider-composites.js");
const OUTPUT_DIR = path.join(SCRIPT_DIR, "results");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "wider-composites-matrix.json");

const COMPOSITE_D8 = process.env.COMPOSITE_D8;
const INTERN_D8 = process.env.INTERN_D8;

if (!COMPOSITE_D8) throw new Error("COMPOSITE_D8 environment variable is required");
if (!INTERN_D8) throw new Error("INTERN_D8 environment variable is required");

const WARMUP = 3;

const WORKLOAD_CONFIGS = [
  {
    key: "creation",
    testCase: "creation",
    D: 50,
    widths: [5, 20, 50, 100],
    nValues: [1],
  },
  {
    key: "fill-set",
    testCase: "fill-set",
    D: 50,
    widths: [5, 20, 50, 100],
    nValues: [1],
  },
  {
    key: "fill-set-reads",
    testCase: "fill-set-reads",
    D: 88,
    widths: [5, 20, 50, 100],
    nValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
];

const TECHNIQUES = [
  { key: "json", label: "JSON", technique: "json", d8: INTERN_D8 },
  { key: "json-custom", label: "JSON (custom)", technique: "json-custom", d8: INTERN_D8 },
  { key: "composite", label: "Composite", technique: "native", d8: COMPOSITE_D8 },
  { key: "intern-composite", label: "Intern Composite", technique: "native", d8: INTERN_D8 },
];

function runOne(d8Path, technique, testCase, width, d, n, exportPath) {
  execFileSync(
    "hyperfine",
    [
      "--warmup", String(WARMUP),
      "--export-json", exportPath,
      `${d8Path} ${BENCHMARK_JS} -- ${width} ${d} ${n} --technique ${technique} --testCase ${testCase}`,
    ],
    { cwd: SCRIPT_DIR, stdio: "inherit" },
  );

  return JSON.parse(readFileSync(exportPath, "utf8")).results[0];
}

function runTechniqueWorkload(d8Path, technique, workloadKey, techniqueKey, testCase, widths, d, nValues) {
  const results = [];

  for (const width of widths) {
    for (const n of nValues) {
      const exportPath = path.join(
        OUTPUT_DIR,
        `${workloadKey}-${techniqueKey}-w${width}-n${n}.hyperfine.json`,
      );

      const result = runOne(d8Path, technique, testCase, width, d, n, exportPath);

      results.push({
        width,
        n,
        mean_seconds: result.mean,
        stddev_seconds: result.stddev,
        median_seconds: result.median,
        min_seconds: result.min,
        max_seconds: result.max,
        user_seconds: result.user,
        system_seconds: result.system,
        command: result.command,
        export_json: exportPath,
      });
    }
  }

  return results;
}

function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const aggregate = {
    benchmark: "wider-composites",
    generated_at: new Date().toISOString(),
    config: {
      warmup: WARMUP,
      benchmark_js: BENCHMARK_JS,
      workloads: WORKLOAD_CONFIGS.map((w) => ({
        key: w.key,
        testCase: w.testCase,
        d: w.D,
        widths: w.widths,
        nValues: w.nValues,
      })),
    },
    builds: {
      composite: COMPOSITE_D8,
      intern_and_json_baselines: INTERN_D8,
    },
    workloads: {},
  };

  for (const workload of WORKLOAD_CONFIGS) {
    console.log(`\n=== ${workload.key} ===\n`);
    aggregate.workloads[workload.key] = {
      testCase: workload.testCase,
      widths: workload.widths,
      nValues: workload.nValues,
      techniques: {},
    };

    for (const entry of TECHNIQUES) {
      console.log(`Running ${entry.label} for ${workload.key}...`);
      const results = runTechniqueWorkload(
        entry.d8,
        entry.technique,
        workload.key,
        entry.key,
        workload.testCase,
        workload.widths,
        workload.D,
        workload.nValues,
      );

      aggregate.workloads[workload.key].techniques[entry.key] = {
        label: entry.label,
        technique: entry.technique,
        d8_path: entry.d8,
        results,
      };
    }
  }

  writeFileSync(OUTPUT_JSON, JSON.stringify(aggregate, null, 2), "utf8");
  console.log(`\nSaved aggregate results to:\n${OUTPUT_JSON}\n`);
}

main();
