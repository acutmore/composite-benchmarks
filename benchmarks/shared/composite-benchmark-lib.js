(function initCompositeBenchmarkLib(globalObj) {
  "use strict";

  function assert(v, msg) {
    if (!v) {
      const err = new Error(msg || "assertion failed");
      Error.captureStackTrace(err, assert);
      throw err;
    }
  }

  function parseCliArgs(cliArgs) {
    const [D = 50, N = 1] = cliArgs
      .map((v) => parseInt(v, 10))
      .filter((v) => isFinite(v));
    if (D < 1) throw new Error("D must be >= 1");
    if (N < 1) throw new Error("N must be >= 1");
    return { D, N };
  }

  function createKeyFactory(requireFn, technique, bespokeFactoryName) {
    if (technique === "native") {
      return function createKey(k) {
        return new Composite(k);
      };
    }

    if (technique === "polyfill") {
      requireFn("../../reference-implementations/polyfill.js");
      globalObj["compositePolyfill"].install(globalObj);
      return function createKey(k) {
        return new Composite(k);
      };
    }

    if (technique === "polyfill-interned") {
      requireFn("../../reference-implementations/polyfill-interned.js");
      globalObj["compositePolyfill"].install(globalObj);
      return function createKey(k) {
        return Composite(k);
      };
    }

    if (technique === "json") {
      return function createKey(k) {
        return JSON.stringify(k);
      };
    }

    if (technique === "json-custom") {
      let customJson = (_k, v) => v;
      return function createKey(k) {
        return JSON.stringify(k, customJson);
      };
    }

    if (technique === "bespoke-js") {
      requireFn("../../reference-implementations/interned-vector.js");
      const factory = globalObj[bespokeFactoryName];
      if (typeof factory !== "function") {
        throw new Error("Unknown bespoke factory " + bespokeFactoryName);
      }
      return function createKey(k) {
        return factory(k);
      };
    }

    throw new Error("Unknown technique " + technique);
  }

  function runStandardBenchmark(options) {
    const {
      requireFn,
      cliArgs,
      technique,
      testCase,
      bespokeFactoryName,
      loop,
      expectedSize,
    } = options;

    const { D, N } = parseCliArgs(cliArgs);
    const createKey = createKeyFactory(
      requireFn,
      technique,
      bespokeFactoryName,
    );
    const theSet = new Set();

    function addKeyToSet(_value, key) {
      theSet.add(key);
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

      loop(D, createKey, add);
      results.length = 0;
      i = 0;
      loop(D, createKey, add);
      results.length = 0;
    } else if (testCase === "fill-set") {
      loop(D, createKey, addKeyToSet);
      loop(D, createKey, addKeyToSet);
      assert(
        theSet.size === expectedSize(D),
        "Expected " + expectedSize(D) + ", got " + theSet.size,
      );
    } else if (testCase === "fill-set-reads") {
      let arr = [];
      loop(D, createKey, (_, key) => {
        arr[arr.length] = key;
      });

      for (let i = 0; i < N; i++) {
        for (let k = 0; k < arr.length; k++) {
          theSet.add(arr[k]);
        }
      }
    } else {
      throw new Error("unknown testcase: " + testCase);
    }

    theSet.clear();
  }

  globalObj.__compositeBenchmarkLib = {
    parseCliArgs,
    runStandardBenchmark,
  };
})(globalThis);