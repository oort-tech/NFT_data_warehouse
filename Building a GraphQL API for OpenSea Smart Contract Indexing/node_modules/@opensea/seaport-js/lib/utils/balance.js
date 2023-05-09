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
exports.balanceOf = void 0;
var ethers_1 = require("ethers");
var ERC1155_1 = require("../abi/ERC1155");
var ERC20_1 = require("../abi/ERC20");
var ERC721_1 = require("../abi/ERC721");
var constants_1 = require("../constants");
var item_1 = require("./item");
var balanceOf = function (owner, item, multicallProvider, criteria) { return __awaiter(void 0, void 0, void 0, function () {
    var contract, contract, startAmount, endAmount, contract;
    return __generator(this, function (_a) {
        if ((0, item_1.isErc721Item)(item.itemType)) {
            contract = new ethers_1.Contract(item.token, ERC721_1.ERC721ABI, multicallProvider);
            if (item.itemType === constants_1.ItemType.ERC721_WITH_CRITERIA) {
                return [2 /*return*/, criteria
                        ? contract
                            .ownerOf(criteria.identifier)
                            .then(function (ownerOf) {
                            return ethers_1.BigNumber.from(Number(ownerOf.toLowerCase() === owner.toLowerCase()));
                        })
                        : contract.balanceOf(owner)];
            }
            return [2 /*return*/, contract
                    .ownerOf(item.identifierOrCriteria)
                    .then(function (ownerOf) {
                    return ethers_1.BigNumber.from(Number(ownerOf.toLowerCase() === owner.toLowerCase()));
                })];
        }
        else if ((0, item_1.isErc1155Item)(item.itemType)) {
            contract = new ethers_1.Contract(item.token, ERC1155_1.ERC1155ABI, multicallProvider);
            if (item.itemType === constants_1.ItemType.ERC1155_WITH_CRITERIA) {
                if (!criteria) {
                    startAmount = ethers_1.BigNumber.from(item.startAmount);
                    endAmount = ethers_1.BigNumber.from(item.endAmount);
                    return [2 /*return*/, startAmount.gt(endAmount) ? startAmount : endAmount];
                }
                return [2 /*return*/, contract.balanceOf(owner, criteria.identifier)];
            }
            return [2 /*return*/, contract.balanceOf(owner, item.identifierOrCriteria)];
        }
        if ((0, item_1.isErc20Item)(item.itemType)) {
            contract = new ethers_1.Contract(item.token, ERC20_1.ERC20ABI, multicallProvider);
            return [2 /*return*/, contract.balanceOf(owner)];
        }
        return [2 /*return*/, multicallProvider.getBalance(owner)];
    });
}); };
exports.balanceOf = balanceOf;
//# sourceMappingURL=balance.js.map