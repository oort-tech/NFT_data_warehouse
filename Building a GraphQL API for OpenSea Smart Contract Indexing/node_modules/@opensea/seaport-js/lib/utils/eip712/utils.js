"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextLayer = exports.getRoot = exports.fillArray = exports.hashConcat = exports.bufferKeccak = exports.hexToBuffer = exports.bufferToHex = exports.chunk = exports.makeArray = void 0;
var utils_1 = require("ethers/lib/utils");
var makeArray = function (len, getValue) {
    return Array(len)
        .fill(0)
        .map(function (_, i) { return getValue(i); });
};
exports.makeArray = makeArray;
var chunk = function (array, size) {
    return (0, exports.makeArray)(Math.ceil(array.length / size), function (i) {
        return array.slice(i * size, (i + 1) * size);
    });
};
exports.chunk = chunk;
var bufferToHex = function (buf) { return (0, utils_1.hexlify)(buf); };
exports.bufferToHex = bufferToHex;
var hexToBuffer = function (value) {
    return Buffer.from(value.slice(2), "hex");
};
exports.hexToBuffer = hexToBuffer;
var bufferKeccak = function (value) { return (0, exports.hexToBuffer)((0, utils_1.keccak256)(value)); };
exports.bufferKeccak = bufferKeccak;
var hashConcat = function (arr) { return (0, exports.bufferKeccak)((0, utils_1.hexConcat)(arr)); };
exports.hashConcat = hashConcat;
var fillArray = function (arr, length, value) {
    if (length > arr.length)
        arr.push.apply(arr, __spreadArray([], __read(Array(length - arr.length).fill(value)), false));
    return arr;
};
exports.fillArray = fillArray;
var getRoot = function (elements, hashLeaves) {
    if (hashLeaves === void 0) { hashLeaves = true; }
    if (elements.length === 0)
        throw new Error("empty tree");
    var leaves = elements.map(function (e) {
        var leaf = Buffer.isBuffer(e) ? e : (0, exports.hexToBuffer)(e);
        return hashLeaves ? (0, exports.bufferKeccak)(leaf) : leaf;
    });
    var layers = [leaves];
    // Get next layer until we reach the root
    while (layers[layers.length - 1].length > 1) {
        layers.push((0, exports.getNextLayer)(layers[layers.length - 1]));
    }
    return layers[layers.length - 1][0];
};
exports.getRoot = getRoot;
var getNextLayer = function (elements) {
    return (0, exports.chunk)(elements, 2).map(exports.hashConcat);
};
exports.getNextLayer = getNextLayer;
//# sourceMappingURL=utils.js.map