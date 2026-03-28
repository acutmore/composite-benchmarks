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

  function cubeLoop(D, createKey, cb) {
    var vec = {};
    vec.x = 0;
    vec.y = 0;
    vec.z = 0;

    for (var x = 0; x < D; x++) {
      vec.x = offset + x;
      for (var y = 0; y < D; y++) {
        vec.y = offset + y;
        for (var z = 0; z < D; z++) {
          vec.z = offset + z;
          cb(vec, createKey(vec));
        }
      }
    }
  }

  runStandardBenchmark({
    requireFn: require,
    cliArgs,
    technique,
    testCase,
    bespokeFactoryName: "weakVec3",
    loop: cubeLoop,
    expectedSize(D) {
      return D ** 3;
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
