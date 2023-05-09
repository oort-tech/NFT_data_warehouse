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
exports.getMaximumSizeForOrder = exports.getSummedTokenAndIdentifierAmounts = exports.getPresentItemAmount = exports.isCriteriaItem = exports.isErc1155Item = exports.isErc721Item = exports.isErc20Item = exports.isNativeCurrencyItem = exports.isCurrencyItem = void 0;
var ethers_1 = require("ethers");
var constants_1 = require("../constants");
var criteria_1 = require("./criteria");
var gcd_1 = require("./gcd");
var isCurrencyItem = function (_a) {
    var itemType = _a.itemType;
    return [constants_1.ItemType.NATIVE, constants_1.ItemType.ERC20].includes(itemType);
};
exports.isCurrencyItem = isCurrencyItem;
var isNativeCurrencyItem = function (_a) {
    var itemType = _a.itemType;
    return itemType === constants_1.ItemType.NATIVE;
};
exports.isNativeCurrencyItem = isNativeCurrencyItem;
var isErc20Item = function (itemType) {
    return itemType === constants_1.ItemType.ERC20;
};
exports.isErc20Item = isErc20Item;
var isErc721Item = function (itemType) {
    return [constants_1.ItemType.ERC721, constants_1.ItemType.ERC721_WITH_CRITERIA].includes(itemType);
};
exports.isErc721Item = isErc721Item;
var isErc1155Item = function (itemType) {
    return [constants_1.ItemType.ERC1155, constants_1.ItemType.ERC1155_WITH_CRITERIA].includes(itemType);
};
exports.isErc1155Item = isErc1155Item;
var isCriteriaItem = function (itemType) {
    return [constants_1.ItemType.ERC721_WITH_CRITERIA, constants_1.ItemType.ERC1155_WITH_CRITERIA].includes(itemType);
};
exports.isCriteriaItem = isCriteriaItem;
var getPresentItemAmount = function (_a) {
    var startAmount = _a.startAmount, endAmount = _a.endAmount, timeBasedItemParams = _a.timeBasedItemParams;
    var startAmountBn = ethers_1.BigNumber.from(startAmount);
    var endAmountBn = ethers_1.BigNumber.from(endAmount);
    if (!timeBasedItemParams) {
        return startAmountBn.gt(endAmountBn) ? startAmountBn : endAmountBn;
    }
    var isConsiderationItem = timeBasedItemParams.isConsiderationItem, currentBlockTimestamp = timeBasedItemParams.currentBlockTimestamp, ascendingAmountTimestampBuffer = timeBasedItemParams.ascendingAmountTimestampBuffer, startTime = timeBasedItemParams.startTime, endTime = timeBasedItemParams.endTime;
    var duration = ethers_1.BigNumber.from(endTime).sub(startTime);
    var isAscending = endAmountBn.gt(startAmount);
    var adjustedBlockTimestamp = ethers_1.BigNumber.from(isAscending
        ? currentBlockTimestamp + ascendingAmountTimestampBuffer
        : currentBlockTimestamp);
    if (adjustedBlockTimestamp.lt(startTime)) {
        return startAmountBn;
    }
    var elapsed = (adjustedBlockTimestamp.gt(endTime)
        ? ethers_1.BigNumber.from(endTime)
        : adjustedBlockTimestamp).sub(startTime);
    var remaining = duration.sub(elapsed);
    // Adjust amounts based on current time
    // For offer items, we round down
    // For consideration items, we round up
    return startAmountBn
        .mul(remaining)
        .add(endAmountBn.mul(elapsed))
        .add(isConsiderationItem ? duration.sub(1) : 0)
        .div(duration);
};
exports.getPresentItemAmount = getPresentItemAmount;
var getSummedTokenAndIdentifierAmounts = function (_a) {
    var items = _a.items, criterias = _a.criterias, timeBasedItemParams = _a.timeBasedItemParams;
    var itemToCriteria = (0, criteria_1.getItemToCriteriaMap)(items, criterias);
    var tokenAndIdentifierToSummedAmount = items.reduce(function (map, item) {
        var _a, _b;
        var _c, _d, _e, _f;
        var identifierOrCriteria = (_d = (_c = itemToCriteria.get(item)) === null || _c === void 0 ? void 0 : _c.identifier) !== null && _d !== void 0 ? _d : item.identifierOrCriteria;
        return __assign(__assign({}, map), (_a = {}, _a[item.token] = __assign(__assign({}, map[item.token]), (_b = {}, _b[identifierOrCriteria] = ((_f = (_e = map[item.token]) === null || _e === void 0 ? void 0 : _e[identifierOrCriteria]) !== null && _f !== void 0 ? _f : ethers_1.BigNumber.from(0)).add((0, exports.getPresentItemAmount)({
            startAmount: item.startAmount,
            endAmount: item.endAmount,
            timeBasedItemParams: timeBasedItemParams,
        })), _b)), _a));
    }, {});
    return tokenAndIdentifierToSummedAmount;
};
exports.getSummedTokenAndIdentifierAmounts = getSummedTokenAndIdentifierAmounts;
/**
 * Returns the maximum size of units possible for the order
 * If any of the items on a partially fillable order specify a different "startAmount" and "endAmount
 * (e.g. they are ascending-amount or descending-amount items), the fraction will be applied to both amounts
 * prior to determining the current price. This ensures that cleanly divisible amounts can be chosen when
 * constructing the order without a dependency on the time when the order is ultimately fulfilled.
 */
var getMaximumSizeForOrder = function (_a) {
    var _b = _a.parameters, offer = _b.offer, consideration = _b.consideration;
    var allItems = __spreadArray(__spreadArray([], __read(offer), false), __read(consideration), false);
    var amounts = allItems.flatMap(function (_a) {
        var startAmount = _a.startAmount, endAmount = _a.endAmount;
        return [
            startAmount,
            endAmount,
        ];
    });
    return (0, gcd_1.findGcd)(amounts);
};
exports.getMaximumSizeForOrder = getMaximumSizeForOrder;
//# sourceMappingURL=item.js.map