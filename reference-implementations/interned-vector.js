(function (global) {
"use strict";
global.weakVec3 = weakVec3;

let freeze = Object.freeze;

let weakRoot = new Map();
function cleanUp(map, ns) {
    let next = ns.shift();
    let result = map.get(next);
    if (!result) return map.size === 0;
    if (ns.length === 0) {
        // WeakRef leaf
        if (!result.deref()) {
            map.delete(next);
            return map.size === 0;
        }
        return false;
    } else {
        if (cleanUp(result, ns)) {
            map.delete(next);
            return map.size === 0;
        } else {
            return false;
        }
    }
}

let fr = new FinalizationRegistry((ns) => {
    cleanUp(weakRoot, ns);
});

function weakVec3(arg) {
    let xv = arg.x;
    let x = weakRoot.get(xv);
    if (x === void 0) {
        x = new Map();
        weakRoot.set(xv, x);
    }
    let yv = arg.y;
    let y = x.get(yv);
    if (y === void 0) {
        y = new Map();
        x.set(yv, y);
    }
    let zv = arg.z;
    let vec = y.get(zv)?.deref();
    if (vec === void 0) {
        vec = freeze({ x: xv, y: yv, z: zv });
        fr.register(vec, [xv, yv, zv]);
        y.set(zv, new WeakRef(vec));
    }
    return vec; // {x,y,z}
}

}(globalThis));
