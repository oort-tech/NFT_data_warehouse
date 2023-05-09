"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerkleTree = void 0;
var ethers_1 = require("ethers");
var utils_1 = require("ethers/lib/utils");
var merkletreejs_1 = __importDefault(require("merkletreejs"));
var hashIdentifier = function (identifier) {
    return (0, utils_1.keccak256)(Buffer.from(ethers_1.BigNumber.from(identifier).toHexString().slice(2).padStart(64, "0"), "hex"));
};
/**
 * Simple wrapper over the MerkleTree in merkletreejs.
 * Handles hashing identifiers to be compatible with Seaport.
 */
var MerkleTree = /** @class */ (function () {
    function MerkleTree(identifiers) {
        this.tree = new merkletreejs_1.default(identifiers.map(hashIdentifier), utils_1.keccak256, {
            sort: true,
        });
    }
    MerkleTree.prototype.getProof = function (identifier) {
        return this.tree.getHexProof(hashIdentifier(identifier));
    };
    MerkleTree.prototype.getRoot = function () {
        return this.tree.getRoot().toString("hex") ? this.tree.getHexRoot() : "0";
    };
    return MerkleTree;
}());
exports.MerkleTree = MerkleTree;
//# sourceMappingURL=merkletree.js.map