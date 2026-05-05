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
    arrayPrototypeMethods: () => arrayPrototypeMethods,
    install: () => install,
    mapPrototypeMethods: () => mapPrototypeMethods,
    setPrototypeMethods: () => setPrototypeMethods
  });

  // polyfill/internal/originals.ts
  var Number = globalThis.Number;
  var { isNaN, NaN, POSITIVE_INFINITY, NEGATIVE_INFINITY } = Number;
  var { abs, floor, min, imul } = Math;
  var { apply, ownKeys, getOwnPropertyDescriptor, setPrototypeOf } = Reflect;
  var { is, freeze, prototype: objectPrototype } = Object;
  var { sort, splice, includes, indexOf, lastIndexOf } = Array.prototype;
  var { keyFor, iterator } = Symbol;
  var { localeCompare, charCodeAt } = String.prototype;
  var Map = globalThis.Map;
  var { has: mapHas, set: mapSet, get: mapGet, delete: mapDelete, clear: mapClear } = Map.prototype;
  var mapSize = getOwnPropertyDescriptor(Map.prototype, "size").get;
  var Set = globalThis.Set;
  var { has: setHas, add: setAdd, clear: setClear, delete: setDelete, values: setValues } = Set.prototype;
  var setSize = getOwnPropertyDescriptor(Set.prototype, "size").get;
  var setNext = new Set().values().next;
  var WeakMap2 = globalThis.WeakMap;
  var { set: weakMapSet, get: weakMapGet } = WeakMap2.prototype;

  // polyfill/internal/utils.ts
  function sameValueZero(a, b) {
    return is(a === 0 ? 0 : a, b === 0 ? 0 : b);
  }
  var EMPTY = freeze([]);

  // polyfill/internal/composite-class.ts
  var __Composite__ = class {
    // 0 == lazy hash
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
      if (hash === 0) hash = 1;
      c.#hash = hash;
    }
  };
  setPrototypeOf(__Composite__.prototype, null);
  var { getCompositeHash, maybeGetCompositeHash, objectIsComposite, setHash } = __Composite__;

  // polyfill/composite.ts
  function Composite(arg) {
    if (new.target) {
      throw new TypeError("Composite should not be constructed with 'new'");
    }
    if (typeof arg !== "object" || arg === null) {
      throw new TypeError("Composite should be constructed with an object");
    }
    const argKeys = ownKeys(arg);
    const c = new __Composite__();
    const stringKeys = [];
    for (let i = 0; i < argKeys.length; i++) {
      let k = argKeys[i];
      if (typeof k === "string") {
        stringKeys[stringKeys.length] = k;
      } else {
        c[k] = arg[k];
      }
    }
    apply(sort, stringKeys, EMPTY);
    for (let i = 0; i < stringKeys.length; i++) {
      let k = stringKeys[i];
      c[k] = arg[k];
    }
    setPrototypeOf(c, objectPrototype);
    freeze(c);
    return c;
  }
  function isComposite(arg) {
    return typeof arg === "object" && arg !== null && objectIsComposite(arg);
  }
  Composite.isComposite = isComposite;
  function compositeEqual(a, b) {
    if (a === b) return true;
    const maybeHashA = typeof a === "object" && a !== null ? maybeGetCompositeHash(a) : void 0;
    const maybeHashB = maybeHashA !== void 0 && typeof b === "object" && b !== null ? maybeGetCompositeHash(b) : void 0;
    if (maybeHashB === void 0) {
      return sameValueZero(a, b);
    }
    if (maybeHashA !== 0 && maybeHashB !== 0 && maybeHashA !== maybeHashB) return false;
    const aKeys = ownKeys(a);
    const bKeys = ownKeys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    let symbolKeysB;
    let firstSymbolIndex;
    for (let i = 0; i < aKeys.length; i++) {
      const aKey = aKeys[i];
      const bKey = bKeys[i];
      if (typeof aKey !== typeof bKey) {
        return false;
      }
      if (typeof aKey === "symbol") {
        if (symbolKeysB === void 0) {
          symbolKeysB = new Set();
          firstSymbolIndex = i;
        }
        apply(setAdd, symbolKeysB, [bKey]);
        continue;
      }
      if (aKey !== bKey) {
        return false;
      }
    }
    if (firstSymbolIndex !== void 0) {
      for (let i = firstSymbolIndex; i < aKeys.length; i++) {
        if (!apply(setHas, symbolKeysB, [aKeys[i]])) {
          return false;
        }
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
    if (maybeHashA === 0 && maybeHashB !== 0) {
      setHash(a, maybeHashB);
    } else if (maybeHashB === 0 && maybeHashA !== 0) {
      setHash(b, maybeHashA);
    }
    return true;
  }
  Composite.equal = compositeEqual;

  // polyfill/internal/hashmap.ts
  var missing = Symbol("missing");
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
  var HashStore = class {
    #hasher;
    #equals;
    #map = new SafeMap();
    constructor(hasher, equals) {
      this.#hasher = hasher;
      this.#equals = equals;
    }
    clear() {
      this.#map.safeClear();
    }
    #get(key) {
      const hash = this.#hasher(key);
      const bucket = this.#map.safeGet(hash);
      if (bucket === void 0) {
        return missing;
      }
      var eq;
      for (let i = 0; i < bucket.length; i++) {
        eq ??= this.#equals;
        const b = bucket[i];
        if (eq(b, key)) {
          return b;
        }
      }
      return missing;
    }
    has(key) {
      return this.#get(key) !== missing;
    }
    get(key) {
      const value = this.#get(key);
      if (value === missing) {
        return void 0;
      }
      return value;
    }
    set(key) {
      const hash = this.#hasher(key);
      let bucket = this.#map.safeGet(hash);
      if (bucket === void 0) {
        bucket = [];
        this.#map.safeSet(hash, bucket);
      }
      for (let i = 0; i < bucket.length; i++) {
        const k = bucket[i];
        if (this.#equals(k, key)) {
          bucket[i] = key;
          return;
        }
      }
      bucket[bucket.length] = key;
    }
    delete(key) {
      const hash = this.#hasher(key);
      const bucket = this.#map.safeGet(hash);
      if (bucket === void 0) {
        return false;
      }
      for (let i = 0; i < bucket.length; i++) {
        const k = bucket[i];
        if (this.#equals(k, key)) {
          if (bucket.length === 1) {
            this.#map.safeDelete(hash);
          } else {
            apply(splice, bucket, [i, 1]);
          }
          return true;
        }
      }
      return false;
    }
  };
  freeze(HashStore.prototype);
  freeze(HashStore);

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
  var keySortArgs = [keySort];
  function hashComposite(input) {
    const cachedHash2 = getCompositeHash(input);
    if (cachedHash2 !== 0) {
      return cachedHash2;
    }
    const hasher = new MurmurHashStream();
    const keys = ownKeys(input);
    apply(sort, keys, keySortArgs);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (typeof key === "string") {
        hasher.update(KEY);
        hasher.update(key);
        updateHasher(hasher, input[key]);
        continue;
      }
      if (!symbolsInWeakMap && keyFor(key) === void 0) {
        break;
      }
      hasher.update(KEY);
      symbolUpdateHasher(hasher, key);
      updateHasher(hasher, input[key]);
    }
    const hash = hasher.digest();
    setHash(input, hash);
    return hash;
  }
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
      return maybeCompHash !== 0 ? maybeCompHash : hashComposite(input);
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
  function keySort(a, b) {
    if (typeof a !== typeof b) {
      return typeof a === "string" ? 1 : -1;
    }
    if (typeof a === "string") {
      return apply(localeCompare, a, [b]);
    }
    return symbolSort(a, b);
  }
  function symbolSort(a, b) {
    const regA = keyFor(a);
    const regB = keyFor(b);
    if (regA !== void 0 && regB !== void 0) {
      return apply(localeCompare, regA, [regB]);
    }
    if (regA === void 0 && regB === void 0) {
      return symbolsInWeakMap ? secretSymbolSort(a, b) : 0;
    }
    return regA === void 0 ? 1 : -1;
  }
  var secretSymbolOrder = /* @__PURE__ */ new WeakMap();
  var nextOrder = 0;
  function getSymbolOrder(input) {
    let order = secretSymbolOrder.get(input);
    if (order === void 0) {
      order = nextOrder++;
      secretSymbolOrder.set(input, order);
    }
    return order;
  }
  function secretSymbolSort(a, b) {
    return getSymbolOrder(a) - getSymbolOrder(b);
  }

  // polyfill/internal/key-lookup.ts
  var CompMap = HashStore;
  function replaced2() {
    throw new Error("function replaced");
  }
  var SafeWeakMap = class extends WeakMap2 {
    safeGet(k) {
      replaced2();
    }
    safeSet(k, v) {
      replaced2();
    }
  };
  SafeWeakMap.prototype.safeGet = weakMapGet;
  SafeWeakMap.prototype.safeSet = weakMapSet;
  var compositeKeyLookups = new SafeWeakMap();
  var missing2 = Symbol("missing");
  function resolveKey(collection, key, create) {
    if (!isComposite(key)) {
      return key;
    }
    let compMap = compositeKeyLookups.safeGet(collection);
    if (!compMap) {
      if (!create) return missing2;
      compMap = new CompMap(hashComposite, compositeEqual);
      compositeKeyLookups.safeSet(collection, compMap);
    }
    let keyToUse = compMap.get(key);
    if (!keyToUse) {
      if (!create) return missing2;
      keyToUse = key;
      compMap.set(key);
    }
    return keyToUse;
  }
  function clearCompMap(map) {
    compositeKeyLookups.safeGet(map)?.clear();
  }
  function deleteKey(collection, key) {
    const compMap = compositeKeyLookups.safeGet(collection);
    if (!compMap) {
      return void 0;
    }
    const existingKey = compMap.get(key);
    if (!existingKey) {
      return void 0;
    }
    compMap.delete(key);
    return existingKey;
  }

  // polyfill/collection-map.ts
  function requireInternalSlot(that) {
    apply(mapSize, that, EMPTY);
  }
  function mapPrototypeSet(key, value) {
    requireInternalSlot(this);
    const keyToUse = resolveKey(
      this,
      key,
      /* create */
      true
    );
    apply(mapSet, this, [keyToUse, value]);
    return this;
  }
  function mapPrototypeDelete(key) {
    requireInternalSlot(this);
    if (!isComposite(key)) {
      return apply(mapDelete, this, [key]);
    }
    const existingKey = deleteKey(this, key);
    if (!existingKey) {
      return false;
    }
    apply(mapDelete, this, [existingKey]);
    return true;
  }
  function mapPrototypeHas(key) {
    requireInternalSlot(this);
    const keyToUse = resolveKey(
      this,
      key,
      /* create */
      false
    );
    if (keyToUse === missing2) return false;
    return apply(mapHas, this, [keyToUse]);
  }
  function mapPrototypeGet(key) {
    requireInternalSlot(this);
    const keyToUse = resolveKey(
      this,
      key,
      /* create */
      false
    );
    if (keyToUse === missing2) return void 0;
    return apply(mapGet, this, [keyToUse]);
  }
  function mapPrototypeClear() {
    apply(mapClear, this, EMPTY);
    clearCompMap(this);
  }
  var mapPrototypeMethods = freeze({
    set: mapPrototypeSet,
    delete: mapPrototypeDelete,
    has: mapPrototypeHas,
    get: mapPrototypeGet,
    clear: mapPrototypeClear
  });

  // polyfill/collection-set.ts
  function requireInternalSlot2(that) {
    apply(setSize, that, EMPTY);
  }
  function setPrototypeAdd(value) {
    requireInternalSlot2(this);
    const valueToUse = resolveKey(
      this,
      value,
      /* create */
      true
    );
    apply(setAdd, this, [valueToUse]);
    return this;
  }
  function setPrototypeClear() {
    requireInternalSlot2(this);
    apply(setClear, this, EMPTY);
    clearCompMap(this);
  }
  function setPrototypeDelete(value) {
    requireInternalSlot2(this);
    if (!isComposite(value)) {
      return apply(setDelete, this, [value]);
    }
    const existingKey = deleteKey(this, value);
    if (!existingKey) {
      return false;
    }
    apply(setDelete, this, [existingKey]);
    return true;
  }
  function setPrototypeHas(value) {
    requireInternalSlot2(this);
    const valueToUse = resolveKey(
      this,
      value,
      /* create */
      false
    );
    if (valueToUse === missing2) {
      return false;
    }
    return apply(setHas, this, [valueToUse]);
  }
  function setPrototypeUnion(other) {
    requireInternalSlot2(this);
    const otherSet = getSetRecord(other);
    const result = new Set();
    for (const value of setIterator(this)) {
      apply(setPrototypeAdd, result, [value]);
    }
    for (const value of otherSet.keys()) {
      apply(setPrototypeAdd, result, [value]);
    }
    return result;
  }
  function setPrototypeIntersection(other) {
    requireInternalSlot2(this);
    const otherSet = getSetRecord(other);
    const result = new Set();
    if (apply(setSize, this, EMPTY) <= otherSet.size) {
      for (const value of setIterator(this)) {
        if (otherSet.has(value)) {
          apply(setPrototypeAdd, result, [value]);
        }
      }
    } else {
      for (const value of otherSet.keys()) {
        if (apply(setPrototypeHas, this, [value])) {
          apply(setPrototypeAdd, result, [value]);
        }
      }
    }
    return result;
  }
  function setPrototypeDifference(other) {
    requireInternalSlot2(this);
    const otherSet = getSetRecord(other);
    const result = new Set();
    for (const value of setIterator(this)) {
      apply(setPrototypeAdd, result, [value]);
    }
    if (result.size <= otherSet.size) {
      for (const value of result) {
        if (otherSet.has(value)) {
          apply(setPrototypeDelete, result, [value]);
        }
      }
    } else {
      for (const value of otherSet.keys()) {
        apply(setPrototypeDelete, result, [value]);
      }
    }
    return result;
  }
  function setPrototypeSymmetricDifference(other) {
    requireInternalSlot2(this);
    const otherSet = getSetRecord(other);
    const result = new Set();
    for (const value of setIterator(this)) {
      if (!otherSet.has(value)) {
        apply(setPrototypeAdd, result, [value]);
      }
    }
    for (const value of otherSet.keys()) {
      if (!apply(setPrototypeHas, this, [value])) {
        apply(setPrototypeAdd, result, [value]);
      }
    }
    return result;
  }
  function setPrototypeIsSubsetOf(other) {
    requireInternalSlot2(this);
    const otherSet = getSetRecord(other);
    if (apply(setSize, this, EMPTY) > otherSet.size) return false;
    for (const value of setIterator(this)) {
      if (!otherSet.has(value)) {
        return false;
      }
    }
    return true;
  }
  function setPrototypeIsSupersetOf(other) {
    requireInternalSlot2(this);
    const otherSet = getSetRecord(other);
    if (apply(setSize, this, EMPTY) < otherSet.size) return false;
    for (const value of otherSet.keys()) {
      if (!apply(setPrototypeHas, this, [value])) {
        return false;
      }
    }
    return true;
  }
  function setPrototypeIsDisjointFrom(other) {
    requireInternalSlot2(this);
    const otherSet = getSetRecord(other);
    if (apply(setSize, this, EMPTY) <= otherSet.size) {
      for (const value of setIterator(this)) {
        if (otherSet.has(value)) {
          return false;
        }
      }
    } else {
      for (const value of otherSet.keys()) {
        if (apply(setPrototypeHas, this, [value])) {
          return false;
        }
      }
    }
    return true;
  }
  var setIteratorProto = {
    __proto__: null,
    nextFn: void 0,
    it: void 0,
    [iterator]() {
      return this;
    },
    next() {
      return apply(this.nextFn, this.it, EMPTY);
    },
    return(value) {
      const ret = this.it.return;
      if (ret) {
        return apply(ret, this.it, [value]);
      }
      return {
        value: void 0,
        done: true
      };
    }
  };
  function setIterator(set) {
    const it = apply(setValues, set, EMPTY);
    return {
      __proto__: setIteratorProto,
      nextFn: setNext,
      it
    };
  }
  var setPrototypeMethods = freeze({
    add: setPrototypeAdd,
    clear: setPrototypeClear,
    delete: setPrototypeDelete,
    has: setPrototypeHas,
    union: setPrototypeUnion,
    intersection: setPrototypeIntersection,
    difference: setPrototypeDifference,
    symmetricDifference: setPrototypeSymmetricDifference,
    isSubsetOf: setPrototypeIsSubsetOf,
    isSupersetOf: setPrototypeIsSupersetOf,
    isDisjointFrom: setPrototypeIsDisjointFrom
  });
  function getSetRecord(other) {
    const size = min(other.size);
    if (isNaN(size)) {
      throw new TypeError("invalid size");
    }
    const intSize = toIntegerOrInfinity(size);
    if (intSize < 0) {
      throw new RangeError("invalid size");
    }
    const has = other.has;
    if (typeof has !== "function") {
      throw new TypeError("invalid has");
    }
    const keys = other.keys;
    if (typeof keys !== "function") {
      throw new TypeError("invalid keys");
    }
    return {
      obj: other,
      size: intSize,
      has(v) {
        return Boolean(apply(has, other, [v]));
      },
      keys() {
        const it = apply(keys, other, EMPTY);
        if (it === null || typeof it !== "object") {
          throw new TypeError("invalid keys");
        }
        const next = it.next;
        return {
          __proto__: setIteratorProto,
          nextFn: next,
          it
        };
      }
    };
  }
  function toIntegerOrInfinity(arg) {
    const n = min(arg);
    if (isNaN(n) || n === 0) {
      return 0;
    }
    if (n === POSITIVE_INFINITY) {
      return POSITIVE_INFINITY;
    }
    if (n === NEGATIVE_INFINITY) {
      return NEGATIVE_INFINITY;
    }
    let i = floor(abs(n));
    if (n < 0) {
      i = -i;
    }
    return i;
  }

  // polyfill/collection-array.ts
  function arrayPrototypeIncludes(value) {
    if (isComposite(value)) {
      return arrayPrototypeCompositeIndexOf(
        this,
        value,
        /* reverse: */
        false
      ) !== -1;
    }
    return apply(includes, this, [value]);
  }
  function arrayPrototypeCompositeIndexOf(arr, value, reverse) {
    let triggeredHash = false;
    for (let i = reverse ? arr.length - 1 : 0; reverse ? i >= 0 : i < arr.length; i += reverse ? -1 : 1) {
      const item = arr[i];
      if (!triggeredHash && isComposite(item)) {
        triggeredHash = true;
        hashComposite(value);
      }
      if (compositeEqual(item, value)) {
        return i;
      }
    }
    return -1;
  }
  function arrayPrototypeIndexOf(value) {
    if (isComposite(value)) {
      return arrayPrototypeCompositeIndexOf(
        this,
        value,
        /* reverse:*/
        false
      );
    }
    return apply(indexOf, this, [value]);
  }
  function arrayPrototypeLastIndexOf(value) {
    if (isComposite(value)) {
      return arrayPrototypeCompositeIndexOf(
        this,
        value,
        /* reverse:*/
        true
      );
    }
    return apply(lastIndexOf, this, [value]);
  }
  var arrayPrototypeMethods = freeze({
    includes: arrayPrototypeIncludes,
    indexOf: arrayPrototypeIndexOf,
    lastIndexOf: arrayPrototypeLastIndexOf
  });

  // polyfill/index.ts
  function install(global) {
    global["Composite"] = Composite;
    const arrayMethods = ownKeys(arrayPrototypeMethods);
    for (let i = 0; i < arrayMethods.length; i++) {
      const method = arrayMethods[i];
      const impl = arrayPrototypeMethods[method];
      global["Array"].prototype[method] = impl;
    }
    const mapMethods = ownKeys(mapPrototypeMethods);
    for (let i = 0; i < mapMethods.length; i++) {
      const method = mapMethods[i];
      const impl = mapPrototypeMethods[method];
      global["Map"].prototype[method] = impl;
    }
    const setMethods = ownKeys(setPrototypeMethods);
    for (let i = 0; i < setMethods.length; i++) {
      const method = setMethods[i];
      const impl = setPrototypeMethods[method];
      global["Set"].prototype[method] = impl;
    }
  }
  return __toCommonJS(index_exports);
})();
