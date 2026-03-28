(function main(require, cliArgs) {
  "use strict";

  require("../shared/composite-benchmark-lib.js");
  const { parseCliArgs, runStandardBenchmark } =
    globalThis.__compositeBenchmarkLib;

  // CONFIG:
  // ===============================
  var technique; // uncomment below to select
  technique = "json";
  // technique = "json-custom";
  // technique = "bespoke-js";
  // technique = "native";
  // technique = "polyfill";
  // technique = "polyfill-interned";
  // ===============================
  var testCase; // uncomment below to select
  testCase = "creation";
  // testCase = "fill-set";
  // testCase = "fill-set-reads";
  // ===============================
  const { D } = parseCliArgs(cliArgs);
  // ===============================
  var offset = Number.MAX_SAFE_INTEGER - D;
  // ===============================

  function widerLoop(D, createKey, cb) {
    var obj = {};
    obj.a = 0;
    obj.b = 0;
    obj.c = 0;
    obj.d = 0;
    obj.e = 0;

    for (var a = 0; a < D; a++) {
      obj.a = offset + a;
      for (var b = 0; b < D; b++) {
        obj.b = offset + b;
        for (var c = 0; c < D; c++) {
          obj.c = offset + c;
          for (var d = 0; d < D; d++) {
            obj.d = offset + d;
            for (var e = 0; e < D; e++) {
              obj.e = offset + e;
              cb(obj, createKey(obj));
            }
          }
        }
      }
    }
  }

  runStandardBenchmark({
    requireFn: require,
    cliArgs,
    technique,
    testCase,
    bespokeFactoryName: "weakVec5",
    loop: widerLoop,
    expectedSize(D) {
      return D ** 5;
    },
  });
})(
  typeof require === "function" ? require : load,
  typeof process !== "undefined"
    ? process.argv.slice(2)
    : typeof arguments !== "undefined"
      ? arguments
      : [],
);
