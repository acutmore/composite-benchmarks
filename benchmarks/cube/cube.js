(function main(require, cliArgs) {
  "use strict";

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
  const [D = 50, N = 1] = cliArgs.map(v => parseInt(v)).filter(v => isFinite(v));
  if (D < 1) throw new Error("D must be >= 1");
  if (N < 1) throw new Error("N must be >= 1");
  // ===============================
  var offset = Number.MAX_SAFE_INTEGER - D;
  // ===============================

  function assert(v, msg) {
    if (!v) {
      const err = new Error(msg || "assertion failed");
      Error.captureStackTrace(err, assert);
      throw err;
    }
  }

  var theSet = new Set();
  var createKey;
  function addKeyToSet(_vec, k) {
    theSet.add(k);
  };

  if (technique === "native") {
    createKey = function createKey(k) {
      return new Composite(k);
    };
  } else if (technique === "polyfill") {
    require("../../reference-implementations/polyfill.js");
    globalThis["compositePolyfill"].install(globalThis);
    createKey = function createKey(k) {
      return new Composite(k);
    }
  } else if (technique === "polyfill-interned") {
    require("../../reference-implementations/polyfill-interned.js");
    globalThis["compositePolyfill"].install(globalThis);
    createKey = function createKey(k) {
      return Composite(k);
    }
  } else if (technique === "json") {
    createKey = function createKey(k) {
      return JSON.stringify(k);
    }
  } else if (technique === "json-custom") {
    let customJson = (k, v) => v;
    createKey = function createKey(k) {
      return JSON.stringify(k, customJson);
    }
  } else if (technique === "bespoke-js") {
    require("../../reference-implementations/interned-vector.js");
    createKey = function createKey(k) {
      return weakVec3(k);
    }
  } else {
    throw new Error("Unknown technique " + technique);
  }

  function cubeLoop(D, cb) {
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

  if (testCase === "creation") {
    var results = [];
    var i = 0;
    function add(_, key) {
      results[i] = key;
      i += 1;
      if (i > 10) {
        i = 0;
      }
    }
    cubeLoop(D, add);
    results.length = 0;
    i = 0;
    cubeLoop(D, add);
    results.length = 0;
  } else if (testCase === "fill-set") {
    cubeLoop(D, addKeyToSet);
    cubeLoop(D, addKeyToSet);
    assert(theSet.size === D ** 3, `Expected ${D ** 3}, got ${theSet.size}`);
  } else if (testCase === "fill-set-reads") {
    let arr = [];
    cubeLoop(D, (_, key) => { arr[arr.length] = key; });
    for (let i = 0; i < N; i++) {
      for (let k = 0; k < arr.length; k++) {
        theSet.add(arr[k]);
      }
    }
  } else {
    throw new Error("unknown testcase: " + testCase)
  }
  theSet.clear();
})(
  typeof require === "function" ? require : load,
  typeof process !== "undefined"
    ? process.argv.slice(2)
    : typeof arguments !== "undefined"
    ? arguments
    : []
);
