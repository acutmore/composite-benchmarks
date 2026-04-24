(function main(require, cliArgs) {
  "use strict";

  require("../shared/composite-benchmark-lib.js");

  function parseWiderCliArgs(cliArgs) {
    const values = cliArgs
      .map((v) => parseInt(v, 10))
      .filter((v) => isFinite(v));

    const [width = 100, D = 88, N = 1] = values;

    if (width < 3) throw new Error("width must be >= 3");
    if (D < 1) throw new Error("D must be >= 1");
    if (N < 1) throw new Error("N must be >= 1");

    return { width, D, N };
  }

  const { width, D, N } = parseWiderCliArgs(cliArgs);
  const offset = Number.MAX_SAFE_INTEGER - D;

  function buildBaseObject(width) {
    const obj = { a: 0, b: 0, c: 0 };

    for (let i = 3; i < width; i++) {
      obj["p" + i] = "fixed-string-value-" + i;
    }

    return obj;
  }

  function buildRetainedKeys(width, D) {
    const obj = buildBaseObject(width);
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

  function runRetainedHitBenchmark(width, D, N) {
    const keys = buildRetainedKeys(width, D);
    const theSet = new Set();

    for (let i = 0; i < keys.length; i++) {
      theSet.add(keys[i]);
    }

    if (theSet.size !== D ** 3) {
      throw new Error(`Expected ${D ** 3}, got ${theSet.size}`);
    }

    let hits = 0;

    for (let i = 0; i < N; i++) {
      for (let k = 0; k < keys.length; k++) {
        if (theSet.has(keys[k])) {
          hits++;
        } else {
          throw new Error("Expected retained key hit");
        }
      }
    }

    if (hits !== N * keys.length) {
      throw new Error(`Expected ${N * keys.length} hits, got ${hits}`);
    }

    theSet.clear();
  }

  runRetainedHitBenchmark(width, D, N);
})(
  typeof require === "function" ? require : load,
  typeof process !== "undefined"
    ? process.argv.slice(2)
    : typeof arguments !== "undefined"
      ? arguments
      : [],
);