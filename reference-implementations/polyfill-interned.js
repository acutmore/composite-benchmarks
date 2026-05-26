"use strict";
var compositePolyfill = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // polyfill/index.ts
  var index_exports = {};
  __export(index_exports, {
    Composite: () => Composite,
    install: () => install
  });

  // polyfill/internal/originals.ts
  var Number = globalThis.Number;
  var { isNaN, NaN } = Number;
  var { imul } = Math;
  var { apply, ownKeys, setPrototypeOf } = Reflect;
  var { is, freeze, prototype: objectPrototype } = Object;
  var { sort } = Array.prototype;
  var { charCodeAt } = String.prototype;
  var Map = globalThis.Map;
  var { set: mapSet, get: mapGet, delete: mapDelete, clear: mapClear } = Map.prototype;
  var WeakMap2 = globalThis.WeakMap;
  var { set: weakMapSet, get: weakMapGet } = WeakMap2.prototype;
  var WeakRef = globalThis.WeakRef;
  var { deref: weakDeref } = WeakRef.prototype;

  // polyfill/internal/utils.ts
  function sameValueZero(a, b) {
    return is(a === 0 ? 0 : a, b === 0 ? 0 : b);
  }
  var EMPTY = freeze([]);

  // polyfill/internal/composite-class.ts
  var __Composite__ = class {
    #hash = 0;
    static maybeGetCompositeHash(c) {
      if (#hash in c) return c.#hash;
      return void 0;
    }
    static getCompositeHash(c) {
      return c.#hash;
    }
    static objectIsComposite(c) {
      return #hash in c;
    }
    static setHash(c, hash) {
      c.#hash = hash;
    }
  };
  setPrototypeOf(__Composite__.prototype, null);
  var { getCompositeHash, maybeGetCompositeHash, objectIsComposite, setHash } = __Composite__;

  // polyfill/internal/murmur.ts
  var RANDOM_SEED = randomHash();
  var STRING_MARKER = randomHash();
  var BIG_INT_MARKER = randomHash();
  var NEG_BIG_INT_MARKER = randomHash();
  function randomHash() {
    return Math.random() * (2 ** 31 - 1) >>> 0;
  }
  var MurmurHashStream = class {
    hash = RANDOM_SEED;
    length = 0;
    carry = 0;
    carryBytes = 0;
    _mix(k1) {
      k1 = imul(k1, 3432918353);
      k1 = k1 << 15 | k1 >>> 17;
      k1 = imul(k1, 461845907);
      this.hash ^= k1;
      this.hash = this.hash << 13 | this.hash >>> 19;
      this.hash = imul(this.hash, 5) + 3864292196;
    }
    _writeByte(byte) {
      this.carry |= (byte & 255) << 8 * this.carryBytes;
      this.carryBytes++;
      this.length++;
      if (this.carryBytes === 4) {
        this._mix(this.carry >>> 0);
        this.carry = 0;
        this.carryBytes = 0;
      }
    }
    update(chunk) {
      switch (typeof chunk) {
        case "string":
          this.update(STRING_MARKER);
          for (let i = 0; i < chunk.length; i++) {
            const code = apply(charCodeAt, chunk, [i]);
            this._writeByte(code & 255);
            this._writeByte(code >>> 8 & 255);
          }
          return;
        case "number":
          this._writeByte(chunk & 255);
          this._writeByte(chunk >>> 8 & 255);
          this._writeByte(chunk >>> 16 & 255);
          this._writeByte(chunk >>> 24 & 255);
          return;
        case "bigint": {
          let value = chunk;
          if (value < 0n) {
            value = -value;
            this.update(NEG_BIG_INT_MARKER);
          } else {
            this.update(BIG_INT_MARKER);
          }
          while (value > 0n) {
            this._writeByte(Number(value & 0xffn));
            value >>= 8n;
          }
          if (chunk === 0n) this._writeByte(0);
          return;
        }
        default:
          throw new TypeError(`Unsupported input type: ${typeof chunk}`);
      }
    }
    digest() {
      if (this.carryBytes > 0) {
        let k1 = this.carry >>> 0;
        k1 = imul(k1, 3432918353);
        k1 = k1 << 15 | k1 >>> 17;
        k1 = imul(k1, 461845907);
        this.hash ^= k1;
      }
      this.hash ^= this.length;
      this.hash ^= this.hash >>> 16;
      this.hash = imul(this.hash, 2246822507);
      this.hash ^= this.hash >>> 13;
      this.hash = imul(this.hash, 3266489909);
      this.hash ^= this.hash >>> 16;
      return this.hash >>> 0;
    }
  };

  // polyfill/internal/hash.ts
  var TRUE = randomHash();
  var FALSE = randomHash();
  var NULL = randomHash();
  var UNDEFINED = randomHash();
  var SYMBOLS = randomHash();
  var KEY = randomHash();
  var OBJECTS = randomHash();
  var hashCache = /* @__PURE__ */ new WeakMap();
  var symbolsInWeakMap = (() => {
    try {
      hashCache.set(Symbol(), 0);
      return true;
    } catch {
      return false;
    }
  })();
  function updateHasher(hasher, input) {
    if (input === null) {
      hasher.update(NULL);
      return;
    }
    switch (typeof input) {
      case "undefined":
        hasher.update(UNDEFINED);
        return;
      case "boolean":
        hasher.update(input ? TRUE : FALSE);
        return;
      case "number":
        hasher.update(isNaN(input) ? NaN : input === 0 ? 0 : input);
        return;
      case "bigint":
      case "string":
        hasher.update(input);
        return;
      case "symbol":
        symbolUpdateHasher(hasher, input);
        return;
      case "object":
      case "function":
        hasher.update(cachedHash(input));
        return;
      default:
        throw new TypeError(`Unsupported input type: ${typeof input}`);
    }
  }
  function symbolUpdateHasher(hasher, input) {
    const regA = Symbol.keyFor(input);
    if (regA !== void 0) {
      hasher.update(SYMBOLS);
      hasher.update(regA);
      return;
    }
    if (!symbolsInWeakMap) {
      hasher.update(SYMBOLS);
      return;
    } else {
      hasher.update(cachedHash(input));
    }
  }
  var nextObjectId = 1;
  function cachedHash(input) {
    let maybeCompHash = typeof input === "object" ? maybeGetCompositeHash(input) : void 0;
    if (maybeCompHash !== void 0) {
      return maybeCompHash;
    }
    let hash = apply(weakMapGet, hashCache, [input]);
    if (hash === void 0) {
      hash = nextObjectId ^ OBJECTS;
      nextObjectId++;
      apply(weakMapSet, hashCache, [input, hash]);
      return hash;
    }
    return hash;
  }

  // polyfill/internal/safe.ts
  function replaced() {
    throw new Error("implementation replaced");
  }
  var SafeMap = class extends Map {
    safeGet(k) {
      replaced();
    }
    safeSet(k, v) {
      replaced();
    }
    safeDelete(k) {
      replaced();
    }
    safeClear() {
      replaced();
    }
  };
  SafeMap.prototype.safeGet = mapGet;
  SafeMap.prototype.safeSet = mapSet;
  SafeMap.prototype.safeDelete = mapDelete;
  SafeMap.prototype.safeClear = mapClear;
  freeze(SafeMap.prototype);
  var SafeWeakRef = class extends WeakRef {
    safeDeref() {
      replaced();
    }
  };
  SafeWeakRef.prototype.safeDeref = weakDeref;
  freeze(SafeWeakRef.prototype);

  // polyfill/composite.ts
  var composites = new SafeMap();
  var fr = new FinalizationRegistry((hash) => {
    let bucket = composites.safeGet(hash);
    if (bucket) {
      let write = 0;
      for (let read = 0; read < bucket.length; read++) {
        const ref = bucket[read];
        if (ref.safeDeref() !== void 0) {
          if (write !== read) {
            bucket[write] = ref;
          }
          write++;
        }
      }
      if (write === 0) {
        composites.safeDelete(hash);
      } else if (write < bucket.length) {
        bucket.length = write;
      }
    }
  });
  function Composite(arg) {
    if (new.target) {
      throw new TypeError("Composite should not be constructed with 'new'");
    }
    if (typeof arg !== "object" || arg === null) {
      throw new TypeError("Composite should be constructed with an object");
    }
    const hasher = new MurmurHashStream();
    const argKeys = ownKeys(arg);
    apply(sort, argKeys, EMPTY);
    const c = new __Composite__();
    for (let i = 0; i < argKeys.length; i++) {
      let k = argKeys[i];
      let v = arg[k];
      if (typeof k === "string") {
        hasher.update(KEY);
        hasher.update(k);
        updateHasher(hasher, v);
        c[k] = v;
      } else {
        throw new Error("symbol keys not allowed");
      }
    }
    let hash = hasher.digest();
    let cs = composites.safeGet(hash);
    if (!cs) {
      cs = [new SafeWeakRef(c)];
      composites.safeSet(hash, cs);
    } else {
      var emptyI = -1;
      for (let i = 0; i < cs.length; i++) {
        let ref = cs[i]?.safeDeref();
        if (ref !== void 0) {
          if (compositesStructurallyEqual(ref, c, argKeys)) {
            return ref;
          }
        } else if (emptyI === -1) {
          emptyI = i;
        }
      }
      if (emptyI === -1) {
        cs[cs.length] = new SafeWeakRef(c);
      } else {
        cs[emptyI] = new SafeWeakRef(c);
      }
    }
    fr.register(c, hash);
    setHash(c, hash);
    setPrototypeOf(c, objectPrototype);
    freeze(c);
    return c;
  }
  function isComposite2(arg) {
    return typeof arg === "object" && arg !== null && objectIsComposite(arg);
  }
  Composite.isComposite = isComposite2;
  function compositeEqual(a, b) {
    if (a === b) return true;
    if (!isComposite2(a) || !isComposite2(b)) {
      return sameValueZero(a, b);
    }
    return false;
  }
  function compositesStructurallyEqual(a, b, bKeys) {
    const aKeys = ownKeys(a);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    for (let i = 0; i < aKeys.length; i++) {
      if (aKeys[i] !== bKeys[i]) {
        return false;
      }
    }
    for (let i = 0; i < aKeys.length; i++) {
      const k = aKeys[i];
      const aV = a[k];
      const bV = b[k];
      if (!compositeEqual(aV, bV)) {
        return false;
      }
    }
    return true;
  }

  // polyfill/index.ts
  function install(global) {
    global["Composite"] = Composite;
  }
  return __toCommonJS(index_exports);
})();
