(function main(require, cliArgs) {
  "use strict";

  require("../shared/composite-benchmark-lib.js");
  const { runStandardBenchmark } = globalThis.__compositeBenchmarkLib;

  function parseWiderCliArgs(cliArgs) {
    const positional = [];
    var technique = "json";
    var testCase = "creation";

    for (var i = 0; i < cliArgs.length; i++) {
      if (cliArgs[i] === "--technique") {
        technique = cliArgs[++i];
      } else if (cliArgs[i] === "--testCase") {
        testCase = cliArgs[++i];
      } else {
        var n = parseInt(cliArgs[i], 10);
        if (isFinite(n)) positional.push(n);
      }
    }

    const [width = 5, D = 50, N = 1] = positional;

    if (width < 3) throw new Error("width must be >= 3");
    if (D < 1) throw new Error("D must be >= 1");
    if (N < 1) throw new Error("N must be >= 1");

    return { width, D, N, technique, testCase };
  }

  const { width, D, N, technique, testCase } = parseWiderCliArgs(cliArgs);
  var offset = Number.MAX_SAFE_INTEGER - D;

  let fnBody = "";
  for (let i = 3; i < width; i++) {
    // Pad the string so the properties are sorted strings
    fnBody += `obj.${"p" + (i.toString().padStart(3, "0"))} = "${"fixed-string-value-" + i}";\n`;
  }
  // Generate this code as repeated dynamic property creation
  // is more likely to put the object into "slow dictionary mode".
  const addProps = new Function("obj", `
    "use strict";
    ${fnBody};
    return obj;
  `);

  function widerLoop(D, createKey, cb) {
    var obj = {};
    obj.a = 0;
    obj.b = 0;
    obj.c = 0;

    addProps(obj);

    for (var a = 0; a < D; a++) {
      obj.a = offset + a;
      for (var b = 0; b < D; b++) {
        obj.b = offset + b;
        for (var c = 0; c < D; c++) {
          obj.c = offset + c;
          cb(obj, createKey(obj));
        }
      }
    }
  }

  runStandardBenchmark({
    requireFn: require,
    cliArgs: [String(D), String(N)],
    technique,
    testCase,
    bespokeFactoryName: "weakVec5",
    loop: widerLoop,
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
