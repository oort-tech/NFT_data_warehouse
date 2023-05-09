"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.getBulkOrderTypeHashes = exports.getBulkOrderTypeHash = exports.getBulkOrderTree = exports.getBulkOrderTreeHeight = void 0;
var utils_1 = require("ethers/lib/utils");
var Eip712MerkleTree_1 = require("./Eip712MerkleTree");
var defaults_1 = require("./defaults");
var utils_2 = require("./utils");
var constants_1 = require("../../constants");
function getBulkOrderTypes(height) {
    var types = __assign({}, constants_1.EIP_712_BULK_ORDER_TYPE);
    types.BulkOrder = [
        { name: "tree", type: "OrderComponents".concat("[2]".repeat(height)) },
    ];
    return types;
}
function getBulkOrderTreeHeight(length) {
    return Math.max(Math.ceil(Math.log2(length)), 1);
}
exports.getBulkOrderTreeHeight = getBulkOrderTreeHeight;
function getBulkOrderTree(orderComponents, startIndex, height) {
    if (startIndex === void 0) { startIndex = 0; }
    if (height === void 0) { height = getBulkOrderTreeHeight(orderComponents.length + startIndex); }
    var types = getBulkOrderTypes(height);
    var defaultNode = defaults_1.DefaultGetter.from(types, "OrderComponents");
    var elements = __spreadArray([], __read(orderComponents), false);
    if (startIndex > 0) {
        elements = __spreadArray(__spreadArray([], __read((0, utils_2.fillArray)([], startIndex, defaultNode)), false), __read(orderComponents), false);
    }
    var tree = new Eip712MerkleTree_1.Eip712MerkleTree(types, "BulkOrder", "OrderComponents", elements, height);
    return tree;
}
exports.getBulkOrderTree = getBulkOrderTree;
function getBulkOrderTypeHash(height) {
    var types = getBulkOrderTypes(height);
    var encoder = utils_1._TypedDataEncoder.from(types);
    var typeString = (0, utils_1.toUtf8Bytes)(encoder._types.BulkOrder);
    return (0, utils_1.keccak256)(typeString);
}
exports.getBulkOrderTypeHash = getBulkOrderTypeHash;
function getBulkOrderTypeHashes(maxHeight) {
    var typeHashes = [];
    for (var i = 0; i < maxHeight; i++) {
        typeHashes.push(getBulkOrderTypeHash(i + 1));
    }
    return typeHashes;
}
exports.getBulkOrderTypeHashes = getBulkOrderTypeHashes;
//# sourceMappingURL=bulk-orders.js.map