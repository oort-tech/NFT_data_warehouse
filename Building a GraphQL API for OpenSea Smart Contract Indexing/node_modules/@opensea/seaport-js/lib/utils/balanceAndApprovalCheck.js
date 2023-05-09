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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.validateStandardFulfillBalancesAndApprovals = exports.validateBasicFulfillBalancesAndApprovals = exports.validateOfferBalancesAndApprovals = exports.getInsufficientBalanceAndApprovalAmounts = exports.getBalancesAndApprovals = void 0;
var ethers_1 = require("ethers");
var constants_1 = require("../constants");
var approval_1 = require("./approval");
var balance_1 = require("./balance");
var criteria_1 = require("./criteria");
var item_1 = require("./item");
var findBalanceAndApproval = function (balancesAndApprovals, token, identifierOrCriteria) {
    var balanceAndApproval = balancesAndApprovals.find(function (_a) {
        var checkedToken = _a.token, checkedIdentifierOrCriteria = _a.identifierOrCriteria;
        return token.toLowerCase() === checkedToken.toLowerCase() &&
            checkedIdentifierOrCriteria.toLowerCase() ===
                identifierOrCriteria.toLowerCase();
    });
    if (!balanceAndApproval) {
        throw new Error("Balances and approvals didn't contain all tokens and identifiers");
    }
    return balanceAndApproval;
};
var getBalancesAndApprovals = function (_a) {
    var owner = _a.owner, items = _a.items, criterias = _a.criterias, operator = _a.operator, multicallProvider = _a.multicallProvider;
    return __awaiter(void 0, void 0, void 0, function () {
        var itemToCriteria;
        return __generator(this, function (_b) {
            itemToCriteria = (0, criteria_1.getItemToCriteriaMap)(items, criterias);
            return [2 /*return*/, Promise.all(items.map(function (item) { return __awaiter(void 0, void 0, void 0, function () {
                    var approvedAmountPromise;
                    var _a;
                    var _b, _c;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                approvedAmountPromise = Promise.resolve(ethers_1.BigNumber.from(0));
                                if ((0, item_1.isErc721Item)(item.itemType) || (0, item_1.isErc1155Item)(item.itemType)) {
                                    approvedAmountPromise = (0, approval_1.approvedItemAmount)(owner, item, operator, multicallProvider);
                                }
                                else if ((0, item_1.isErc20Item)(item.itemType)) {
                                    approvedAmountPromise = (0, approval_1.approvedItemAmount)(owner, item, operator, multicallProvider);
                                }
                                // If native token, we don't need to check for approvals
                                else {
                                    approvedAmountPromise = Promise.resolve(constants_1.MAX_INT);
                                }
                                _a = {
                                    token: item.token,
                                    identifierOrCriteria: (_c = (_b = itemToCriteria.get(item)) === null || _b === void 0 ? void 0 : _b.identifier) !== null && _c !== void 0 ? _c : item.identifierOrCriteria
                                };
                                return [4 /*yield*/, (0, balance_1.balanceOf)(owner, item, multicallProvider, itemToCriteria.get(item))];
                            case 1:
                                _a.balance = _d.sent();
                                return [4 /*yield*/, approvedAmountPromise];
                            case 2: return [2 /*return*/, (_a.approvedAmount = _d.sent(),
                                    _a.itemType = item.itemType,
                                    _a)];
                        }
                    });
                }); }))];
        });
    });
};
exports.getBalancesAndApprovals = getBalancesAndApprovals;
var getInsufficientBalanceAndApprovalAmounts = function (_a) {
    var balancesAndApprovals = _a.balancesAndApprovals, tokenAndIdentifierAmounts = _a.tokenAndIdentifierAmounts, operator = _a.operator;
    var tokenAndIdentifierAndAmountNeeded = __spreadArray([], __read(Object.entries(tokenAndIdentifierAmounts).map(function (_a) {
        var _b = __read(_a, 2), token = _b[0], identifierToAmount = _b[1];
        return Object.entries(identifierToAmount).map(function (_a) {
            var _b = __read(_a, 2), identifierOrCriteria = _b[0], amountNeeded = _b[1];
            return [token, identifierOrCriteria, amountNeeded];
        });
    })), false).flat();
    var filterBalancesOrApprovals = function (filterKey) {
        return tokenAndIdentifierAndAmountNeeded
            .filter(function (_a) {
            var _b = __read(_a, 3), token = _b[0], identifierOrCriteria = _b[1], amountNeeded = _b[2];
            return findBalanceAndApproval(balancesAndApprovals, token, identifierOrCriteria)[filterKey].lt(amountNeeded);
        })
            .map(function (_a) {
            var _b = __read(_a, 3), token = _b[0], identifierOrCriteria = _b[1], amount = _b[2];
            var balanceAndApproval = findBalanceAndApproval(balancesAndApprovals, token, identifierOrCriteria);
            return {
                token: token,
                identifierOrCriteria: identifierOrCriteria,
                requiredAmount: amount,
                amountHave: balanceAndApproval[filterKey],
                itemType: balanceAndApproval.itemType,
            };
        });
    };
    var mapToApproval = function (insufficientBalance) { return ({
        token: insufficientBalance.token,
        identifierOrCriteria: insufficientBalance.identifierOrCriteria,
        approvedAmount: insufficientBalance.amountHave,
        requiredApprovedAmount: insufficientBalance.requiredAmount,
        itemType: insufficientBalance.itemType,
        operator: operator,
    }); };
    var _b = __read([
        filterBalancesOrApprovals("balance"),
        filterBalancesOrApprovals("approvedAmount").map(mapToApproval),
    ], 2), insufficientBalances = _b[0], insufficientApprovals = _b[1];
    return {
        insufficientBalances: insufficientBalances,
        insufficientApprovals: insufficientApprovals,
    };
};
exports.getInsufficientBalanceAndApprovalAmounts = getInsufficientBalanceAndApprovalAmounts;
/**
 * 1. The offerer should have sufficient balance of all offered items.
 * 2. If the order does not indicate proxy utilization, the offerer should have sufficient approvals set
 *    for the Seaport contract for all offered ERC20, ERC721, and ERC1155 items.
 * 3. If the order does indicate proxy utilization, the offerer should have sufficient approvals set
 *    for their respective proxy contract for all offered ERC20, ERC721, and ERC1155 items.
 */
var validateOfferBalancesAndApprovals = function (_a) {
    var offer = _a.offer, criterias = _a.criterias, balancesAndApprovals = _a.balancesAndApprovals, timeBasedItemParams = _a.timeBasedItemParams, _b = _a.throwOnInsufficientBalances, throwOnInsufficientBalances = _b === void 0 ? true : _b, throwOnInsufficientApprovals = _a.throwOnInsufficientApprovals, operator = _a.operator;
    var _c = (0, exports.getInsufficientBalanceAndApprovalAmounts)({
        balancesAndApprovals: balancesAndApprovals,
        tokenAndIdentifierAmounts: (0, item_1.getSummedTokenAndIdentifierAmounts)({
            items: offer,
            criterias: criterias,
            timeBasedItemParams: timeBasedItemParams
                ? __assign(__assign({}, timeBasedItemParams), { isConsiderationItem: false }) : undefined,
        }),
        operator: operator,
    }), insufficientBalances = _c.insufficientBalances, insufficientApprovals = _c.insufficientApprovals;
    if (throwOnInsufficientBalances && insufficientBalances.length > 0) {
        throw new Error("The offerer does not have the amount needed to create or fulfill.");
    }
    if (throwOnInsufficientApprovals && insufficientApprovals.length > 0) {
        throw new Error("The offerer does not have the sufficient approvals.");
    }
    return insufficientApprovals;
};
exports.validateOfferBalancesAndApprovals = validateOfferBalancesAndApprovals;
/**
 * When fulfilling a basic order, the following requirements need to be checked to ensure that the order will be fulfillable:
 * 1. Offer checks need to be performed to ensure that the offerer still has sufficient balance and approvals
 * 2. The fulfiller should have sufficient balance of all consideration items except for those with an
 *    item type that matches the order's offered item type — by way of example, if the fulfilled order offers
 *    an ERC20 item and requires an ERC721 item to the offerer and the same ERC20 item to another recipient,
 *    the fulfiller needs to own the ERC721 item but does not need to own the ERC20 item as it will be sourced from the offerer.
 * 3. If the fulfiller does not elect to utilize a proxy, they need to have sufficient approvals set for the
 *    Seaport contract for all ERC20, ERC721, and ERC1155 consideration items on the fulfilled order except
 *    for ERC20 items with an item type that matches the order's offered item type.
 * 4. If the fulfiller does elect to utilize a proxy, they need to have sufficient approvals set for their
 *    respective proxy contract for all ERC20, ERC721, and ERC1155 consideration items on the fulfilled order
 *    except for ERC20 items with an item type that matches the order's offered item type.
 * 5. If the fulfilled order specifies Ether (or other native tokens) as consideration items, the fulfiller must
 *    be able to supply the sum total of those items as msg.value.
 *
 * @returns the list of insufficient owner and proxy approvals
 */
var validateBasicFulfillBalancesAndApprovals = function (_a) {
    var offer = _a.offer, consideration = _a.consideration, offererBalancesAndApprovals = _a.offererBalancesAndApprovals, fulfillerBalancesAndApprovals = _a.fulfillerBalancesAndApprovals, timeBasedItemParams = _a.timeBasedItemParams, offererOperator = _a.offererOperator, fulfillerOperator = _a.fulfillerOperator;
    (0, exports.validateOfferBalancesAndApprovals)({
        offer: offer,
        criterias: [],
        balancesAndApprovals: offererBalancesAndApprovals,
        timeBasedItemParams: timeBasedItemParams,
        throwOnInsufficientApprovals: true,
        operator: offererOperator,
    });
    var considerationWithoutOfferItemType = consideration.filter(function (item) { return item.itemType !== offer[0].itemType; });
    var _b = (0, exports.getInsufficientBalanceAndApprovalAmounts)({
        balancesAndApprovals: fulfillerBalancesAndApprovals,
        tokenAndIdentifierAmounts: (0, item_1.getSummedTokenAndIdentifierAmounts)({
            items: considerationWithoutOfferItemType,
            criterias: [],
            timeBasedItemParams: __assign(__assign({}, timeBasedItemParams), { isConsiderationItem: true }),
        }),
        operator: fulfillerOperator,
    }), insufficientBalances = _b.insufficientBalances, insufficientApprovals = _b.insufficientApprovals;
    if (insufficientBalances.length > 0) {
        throw new Error("The fulfiller does not have the balances needed to fulfill.");
    }
    return insufficientApprovals;
};
exports.validateBasicFulfillBalancesAndApprovals = validateBasicFulfillBalancesAndApprovals;
/**
 * When fulfilling a standard order, the following requirements need to be checked to ensure that the order will be fulfillable:
 * 1. Offer checks need to be performed to ensure that the offerer still has sufficient balance and approvals
 * 2. The fulfiller should have sufficient balance of all consideration items after receiving all offered items
 *    — by way of example, if the fulfilled order offers an ERC20 item and requires an ERC721 item to the offerer
 *    and the same ERC20 item to another recipient with an amount less than or equal to the offered amount,
 *    the fulfiller does not need to own the ERC20 item as it will first be received from the offerer.
 * 3. If the fulfiller does not elect to utilize a proxy, they need to have sufficient approvals set for the
 *    Seaport contract for all ERC20, ERC721, and ERC1155 consideration items on the fulfilled order.
 * 4. If the fulfiller does elect to utilize a proxy, they need to have sufficient approvals set for their
 *    respective proxy contract for all ERC20, ERC721, and ERC1155 consideration items on the fulfilled order.
 * 5. If the fulfilled order specifies Ether (or other native tokens) as consideration items, the fulfiller must
 *    be able to supply the sum total of those items as msg.value.
 *
 * @returns the list of insufficient owner and proxy approvals
 */
var validateStandardFulfillBalancesAndApprovals = function (_a) {
    var offer = _a.offer, consideration = _a.consideration, offerCriteria = _a.offerCriteria, considerationCriteria = _a.considerationCriteria, offererBalancesAndApprovals = _a.offererBalancesAndApprovals, fulfillerBalancesAndApprovals = _a.fulfillerBalancesAndApprovals, timeBasedItemParams = _a.timeBasedItemParams, offererOperator = _a.offererOperator, fulfillerOperator = _a.fulfillerOperator;
    (0, exports.validateOfferBalancesAndApprovals)({
        offer: offer,
        criterias: offerCriteria,
        balancesAndApprovals: offererBalancesAndApprovals,
        timeBasedItemParams: timeBasedItemParams,
        throwOnInsufficientApprovals: true,
        operator: offererOperator,
    });
    var fulfillerBalancesAndApprovalsAfterReceivingOfferedItems = addToExistingBalances({
        items: offer,
        criterias: offerCriteria,
        balancesAndApprovals: fulfillerBalancesAndApprovals,
        timeBasedItemParams: timeBasedItemParams,
    });
    var _b = (0, exports.getInsufficientBalanceAndApprovalAmounts)({
        balancesAndApprovals: fulfillerBalancesAndApprovalsAfterReceivingOfferedItems,
        tokenAndIdentifierAmounts: (0, item_1.getSummedTokenAndIdentifierAmounts)({
            items: consideration,
            criterias: considerationCriteria,
            timeBasedItemParams: __assign(__assign({}, timeBasedItemParams), { isConsiderationItem: true }),
        }),
        operator: fulfillerOperator,
    }), insufficientBalances = _b.insufficientBalances, insufficientApprovals = _b.insufficientApprovals;
    if (insufficientBalances.length > 0) {
        throw new Error("The fulfiller does not have the balances needed to fulfill.");
    }
    return insufficientApprovals;
};
exports.validateStandardFulfillBalancesAndApprovals = validateStandardFulfillBalancesAndApprovals;
var addToExistingBalances = function (_a) {
    var items = _a.items, criterias = _a.criterias, timeBasedItemParams = _a.timeBasedItemParams, balancesAndApprovals = _a.balancesAndApprovals;
    var summedItemAmounts = (0, item_1.getSummedTokenAndIdentifierAmounts)({
        items: items,
        criterias: criterias,
        timeBasedItemParams: __assign(__assign({}, timeBasedItemParams), { isConsiderationItem: false }),
    });
    // Deep clone existing balances
    var balancesAndApprovalsAfterReceivingItems = balancesAndApprovals.map(function (item) { return (__assign({}, item)); });
    // Add each summed item amount to the existing balances as we may want tocheck balances after receiving all items
    Object.entries(summedItemAmounts).forEach(function (_a) {
        var _b = __read(_a, 2), token = _b[0], identifierOrCriteriaToAmount = _b[1];
        return Object.entries(identifierOrCriteriaToAmount).forEach(function (_a) {
            var _b = __read(_a, 2), identifierOrCriteria = _b[0], amount = _b[1];
            var balanceAndApproval = findBalanceAndApproval(balancesAndApprovalsAfterReceivingItems, token, identifierOrCriteria);
            var balanceAndApprovalIndex = balancesAndApprovalsAfterReceivingItems.indexOf(balanceAndApproval);
            balancesAndApprovalsAfterReceivingItems[balanceAndApprovalIndex].balance =
                balancesAndApprovalsAfterReceivingItems[balanceAndApprovalIndex].balance.add(amount);
        });
    });
    return balancesAndApprovalsAfterReceivingItems;
};
//# sourceMappingURL=balanceAndApprovalCheck.js.map