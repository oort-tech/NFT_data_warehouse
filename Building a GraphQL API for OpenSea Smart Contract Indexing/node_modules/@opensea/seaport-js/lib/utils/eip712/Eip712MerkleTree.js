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
exports.Eip712MerkleTree = void 0;
var hash_1 = require("@ethersproject/hash");
var utils_1 = require("ethers/lib/utils");
var merkletreejs_1 = require("merkletreejs");
var defaults_1 = require("./defaults");
var utils_2 = require("./utils");
var getTree = function (leaves, defaultLeafHash) {
    return new merkletreejs_1.MerkleTree(leaves.map(utils_2.hexToBuffer), utils_2.bufferKeccak, {
        complete: true,
        sort: false,
        hashLeaves: false,
        fillDefaultHash: (0, utils_2.hexToBuffer)(defaultLeafHash),
    });
};
var encodeProof = function (key, proof, signature) {
    if (signature === void 0) { signature = "0x".concat("ff".repeat(64)); }
    return (0, utils_1.hexConcat)([
        signature,
        "0x".concat(key.toString(16).padStart(6, "0")),
        utils_1.defaultAbiCoder.encode(["uint256[".concat(proof.length, "]")], [proof]),
    ]);
};
var Eip712MerkleTree = /** @class */ (function () {
    function Eip712MerkleTree(types, rootType, leafType, elements, depth) {
        this.types = types;
        this.rootType = rootType;
        this.leafType = leafType;
        this.elements = elements;
        this.depth = depth;
        var encoder = hash_1._TypedDataEncoder.from(types);
        this.encoder = encoder;
        this.leafHasher = function (leaf) { return encoder.hashStruct(leafType, leaf); };
        this.defaultNode = defaults_1.DefaultGetter.from(types, leafType);
        this.defaultLeaf = this.leafHasher(this.defaultNode);
        this.tree = getTree(this.getCompleteLeaves(), this.defaultLeaf);
    }
    Object.defineProperty(Eip712MerkleTree.prototype, "completedSize", {
        get: function () {
            return Math.pow(2, this.depth);
        },
        enumerable: false,
        configurable: true
    });
    /** Returns the array of elements in the tree, padded to the complete size with empty items. */
    Eip712MerkleTree.prototype.getCompleteElements = function () {
        var elements = this.elements;
        return (0, utils_2.fillArray)(__spreadArray([], __read(elements), false), this.completedSize, this.defaultNode);
    };
    /** Returns the array of leaf nodes in the tree, padded to the complete size with default hashes. */
    Eip712MerkleTree.prototype.getCompleteLeaves = function () {
        var leaves = this.elements.map(this.leafHasher);
        return (0, utils_2.fillArray)(__spreadArray([], __read(leaves), false), this.completedSize, this.defaultLeaf);
    };
    Object.defineProperty(Eip712MerkleTree.prototype, "root", {
        get: function () {
            return this.tree.getHexRoot();
        },
        enumerable: false,
        configurable: true
    });
    Eip712MerkleTree.prototype.getProof = function (i) {
        var leaves = this.getCompleteLeaves();
        var leaf = leaves[i];
        var proof = this.tree.getHexProof(leaf, i);
        var root = this.tree.getHexRoot();
        return { leaf: leaf, proof: proof, root: root };
    };
    Eip712MerkleTree.prototype.getEncodedProofAndSignature = function (i, signature) {
        var proof = this.getProof(i).proof;
        return encodeProof(i, proof, signature);
    };
    Eip712MerkleTree.prototype.getDataToSign = function () {
        var layer = this.getCompleteElements();
        while (layer.length > 2) {
            layer = (0, utils_2.chunk)(layer, 2);
        }
        return layer;
    };
    Eip712MerkleTree.prototype.add = function (element) {
        this.elements.push(element);
    };
    Eip712MerkleTree.prototype.getBulkOrderHash = function () {
        var structHash = this.encoder.hashStruct("BulkOrder", {
            tree: this.getDataToSign(),
        });
        var leaves = this.getCompleteLeaves().map(utils_2.hexToBuffer);
        var rootHash = (0, utils_2.bufferToHex)((0, utils_2.getRoot)(leaves, false));
        var typeHash = (0, utils_1.keccak256)((0, utils_1.toUtf8Bytes)(this.encoder._types.BulkOrder));
        var bulkOrderHash = (0, utils_1.keccak256)((0, utils_1.hexConcat)([typeHash, rootHash]));
        if (bulkOrderHash !== structHash) {
            throw new Error("expected derived bulk order hash to match");
        }
        return structHash;
    };
    return Eip712MerkleTree;
}());
exports.Eip712MerkleTree = Eip712MerkleTree;
//# sourceMappingURL=Eip712MerkleTree.js.map