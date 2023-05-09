"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findGcd = exports.gcd = void 0;
var ethers_1 = require("ethers");
var gcd = function (a, b) {
    var bnA = ethers_1.BigNumber.from(a);
    var bnB = ethers_1.BigNumber.from(b);
    if (bnA.eq(0)) {
        return bnB;
    }
    return (0, exports.gcd)(bnB.mod(a), bnA);
};
exports.gcd = gcd;
var findGcd = function (elements) {
    var result = ethers_1.BigNumber.from(elements[0]);
    for (var i = 1; i < elements.length; i++) {
        result = (0, exports.gcd)(elements[i], result);
        if (result.eq(1)) {
            return result;
        }
    }
    return result;
};
exports.findGcd = findGcd;
//# sourceMappingURL=gcd.js.map