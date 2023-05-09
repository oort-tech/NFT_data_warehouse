"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApprovalActions = exports.approvedItemAmount = void 0;
var ethers_1 = require("ethers");
var ERC20_1 = require("../abi/ERC20");
var ERC721_1 = require("../abi/ERC721");
var constants_1 = require("../constants");
var item_1 = require("./item");
var usecase_1 = require("./usecase");
var approvedItemAmount = function (owner, item, operator, multicallProvider) { return __awaiter(void 0, void 0, void 0, function () {
    var contract, contract;
    return __generator(this, function (_a) {
        if ((0, item_1.isErc721Item)(item.itemType) || (0, item_1.isErc1155Item)(item.itemType)) {
            contract = new ethers_1.Contract(item.token, ERC721_1.ERC721ABI, multicallProvider);
            return [2 /*return*/, contract.isApprovedForAll(owner, operator).then(function (isApprovedForAll) {
                    // Setting to the max int to consolidate types and simplify
                    return isApprovedForAll ? constants_1.MAX_INT : ethers_1.BigNumber.from(0);
                })];
        }
        else if (item.itemType === constants_1.ItemType.ERC20) {
            contract = new ethers_1.Contract(item.token, ERC20_1.ERC20ABI, multicallProvider);
            return [2 /*return*/, contract.allowance(owner, operator)];
        }
        // We don't need to check approvals for native tokens
        return [2 /*return*/, constants_1.MAX_INT];
    });
}); };
exports.approvedItemAmount = approvedItemAmount;
/**
 * Get approval actions given a list of insufficent approvals.
 */
function getApprovalActions(insufficientApprovals, exactApproval, signer) {
    var _this = this;
    return Promise.all(insufficientApprovals
        .filter(function (approval, index) {
        return index === insufficientApprovals.length - 1 ||
            insufficientApprovals[index + 1].token !== approval.token;
    })
        .map(function (_a) {
        var token = _a.token, operator = _a.operator, itemType = _a.itemType, identifierOrCriteria = _a.identifierOrCriteria, requiredApprovedAmount = _a.requiredApprovedAmount;
        return __awaiter(_this, void 0, void 0, function () {
            var isErc1155, contract, contract;
            return __generator(this, function (_b) {
                isErc1155 = (0, item_1.isErc1155Item)(itemType);
                if ((0, item_1.isErc721Item)(itemType) || isErc1155) {
                    contract = new ethers_1.Contract(token, ERC721_1.ERC721ABI, signer);
                    return [2 /*return*/, {
                            type: "approval",
                            token: token,
                            identifierOrCriteria: identifierOrCriteria,
                            itemType: itemType,
                            operator: operator,
                            transactionMethods: (0, usecase_1.getTransactionMethods)(contract.connect(signer), exactApproval && !isErc1155 ? "approve" : "setApprovalForAll", [
                                operator,
                                exactApproval && !isErc1155 ? identifierOrCriteria : true,
                            ]),
                        }];
                }
                else {
                    contract = new ethers_1.Contract(token, ERC20_1.ERC20ABI, signer);
                    return [2 /*return*/, {
                            type: "approval",
                            token: token,
                            identifierOrCriteria: identifierOrCriteria,
                            itemType: itemType,
                            transactionMethods: (0, usecase_1.getTransactionMethods)(contract.connect(signer), "approve", [operator, exactApproval ? requiredApprovedAmount : constants_1.MAX_INT]),
                            operator: operator,
                        }];
                }
                return [2 /*return*/];
            });
        });
    }));
}
exports.getApprovalActions = getApprovalActions;
//# sourceMappingURL=approval.js.map