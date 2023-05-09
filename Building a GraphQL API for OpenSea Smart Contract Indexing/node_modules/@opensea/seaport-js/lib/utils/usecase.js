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
exports.getTagFromDomain = exports.getTransactionMethods = exports.executeAllActions = void 0;
var utils_1 = require("ethers/lib/utils");
var executeAllActions = function (actions) { return __awaiter(void 0, void 0, void 0, function () {
    var i, action, tx, finalAction;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                i = 0;
                _a.label = 1;
            case 1:
                if (!(i < actions.length - 1)) return [3 /*break*/, 5];
                action = actions[i];
                if (!(action.type === "approval")) return [3 /*break*/, 4];
                return [4 /*yield*/, action.transactionMethods.transact()];
            case 2:
                tx = _a.sent();
                return [4 /*yield*/, tx.wait()];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                i++;
                return [3 /*break*/, 1];
            case 5:
                finalAction = actions[actions.length - 1];
                switch (finalAction.type) {
                    case "create":
                        return [2 /*return*/, finalAction.createOrder()];
                    case "createBulk":
                        return [2 /*return*/, finalAction.createBulkOrders()];
                    default:
                        return [2 /*return*/, finalAction.transactionMethods.transact()];
                }
                return [2 /*return*/];
        }
    });
}); };
exports.executeAllActions = executeAllActions;
var instanceOfOverrides = function (obj) {
    var validKeys = [
        "gasLimit",
        "gasPrice",
        "maxFeePerGas",
        "maxPriorityFeePerGas",
        "nonce",
        "type",
        "accessList",
        "customData",
        "ccipReadEnabled",
        "value",
        "blockTag",
        "CallOverrides",
    ];
    return (obj === undefined ||
        Object.keys(obj).every(function (key) { return validKeys.includes(key); }));
};
var getTransactionMethods = function (contract, method, args, domain) {
    if (domain === void 0) { domain = ""; }
    var lastArg = args[args.length - 1];
    var initialOverrides;
    if (instanceOfOverrides(lastArg)) {
        initialOverrides = lastArg;
        args.pop();
    }
    var buildTransaction = function (overrides) { return __awaiter(void 0, void 0, void 0, function () {
        var mergedOverrides, populatedTransaction, tag;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    mergedOverrides = __assign(__assign({}, initialOverrides), overrides);
                    return [4 /*yield*/, (_a = contract.populateTransaction)[method].apply(_a, __spreadArray([], __read(__spreadArray(__spreadArray([], __read(args), false), [mergedOverrides], false)), false))];
                case 1:
                    populatedTransaction = _b.sent();
                    tag = (0, exports.getTagFromDomain)(domain);
                    populatedTransaction.data = populatedTransaction.data + tag;
                    return [2 /*return*/, populatedTransaction];
            }
        });
    }); };
    return {
        callStatic: function (overrides) {
            var _a;
            var mergedOverrides = __assign(__assign({}, initialOverrides), overrides);
            return (_a = contract.callStatic)[method].apply(_a, __spreadArray([], __read(__spreadArray(__spreadArray([], __read(args), false), [mergedOverrides], false)), false));
        },
        estimateGas: function (overrides) {
            var _a;
            var mergedOverrides = __assign(__assign({}, initialOverrides), overrides);
            return (_a = contract.estimateGas)[method].apply(_a, __spreadArray([], __read(__spreadArray(__spreadArray([], __read(args), false), [mergedOverrides], false)), false));
        },
        transact: function (overrides) { return __awaiter(void 0, void 0, void 0, function () {
            var mergedOverrides, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mergedOverrides = __assign(__assign({}, initialOverrides), overrides);
                        return [4 /*yield*/, buildTransaction(mergedOverrides)];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, contract.signer.sendTransaction(data)];
                }
            });
        }); },
        buildTransaction: buildTransaction,
    };
};
exports.getTransactionMethods = getTransactionMethods;
var getTagFromDomain = function (domain) {
    return (0, utils_1.keccak256)((0, utils_1.toUtf8Bytes)(domain)).slice(2, 10);
};
exports.getTagFromDomain = getTagFromDomain;
//# sourceMappingURL=usecase.js.map