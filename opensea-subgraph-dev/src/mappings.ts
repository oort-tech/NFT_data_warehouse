import {
  BigDecimal,
  BigInt
} from "@graphprotocol/graph-ts";

import {AtomicMatch_Call} from "../generated/OpenSea/OpenSea";
import {Trade} from "../generated/schema";

import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  EXCHANGE_MARKETPLACE_FEE,
  INVERSE_BASIS_POINT,
  NULL_ADDRESS,
  WYVERN_ATOMICIZER_ADDRESS,
} from "./constants";
import {
  calculateTradePriceInETH,
  decodeBundleNftCallData,
  decodeSingleNftCallData,
  getOrCreateAsset,
  getOrCreateCollection,
  getOrCreateUser,
  getSaleKind,
  guardedArrayReplace
} from "./utils";

// Note that callHandlers won't be invoked by failed transactions.
// This means whenever our handler is invoked, we must be working with a valid transaction.
// Ref: https://github.com/graphprotocol/graph-node/pull/4149
export function handleAtomicMatch(callInfo: AtomicMatch_Call): void {
  let target = callInfo.inputs.addrs[11];
  let handleOrder = target.equals(WYVERN_ATOMICIZER_ADDRESS) ? handleBundleTrade : handleSingleTrade;
  handleOrder(callInfo);
}

function handleSingleTrade(callInfo: AtomicMatch_Call): void {
  let mergedCallData = guardedArrayReplace(callInfo.inputs.calldataBuy, callInfo.inputs.calldataSell, callInfo.inputs.replacementPatternBuy);

  let target = callInfo.inputs.addrs[11];
  let transferResult = decodeSingleNftCallData(target, mergedCallData);
  if (!transferResult) return;

  let collectionAddr = transferResult.token.toHexString();
  let tokenId = transferResult.tokenId;
  let amount = transferResult.amount;
  let buyer = transferResult.to.toHexString();
  let seller = transferResult.from.toHexString();
  let saleKind = getSaleKind(callInfo.inputs.feeMethodsSidesKindsHowToCalls[6]);
  let paymentToken = callInfo.inputs.addrs[13];
  let priceETH = calculateTradePriceInETH(callInfo, paymentToken);

  getOrCreateUser(seller);
  getOrCreateUser(buyer);
  let assetID = collectionAddr.concat("-").concat(tokenId.toString());
  let asset = getOrCreateAsset(assetID, tokenId, collectionAddr, buyer);

  // Same as Messari API.
  let tradeID = callInfo.transaction.hash.toHexString().concat("-").concat(transferResult.functionSelector).concat("-").concat(tokenId.toString());
  let trade = new Trade(tradeID);
  trade.amount = amount;
  trade.buyer = buyer;
  trade.seller = seller;
  trade.saleKind = saleKind;
  trade.asset = assetID;
  trade.priceETH = priceETH;
  trade.transactionHash = callInfo.transaction.hash.toHexString();
  trade.timestamp = callInfo.block.timestamp;
  trade.blockNumber = callInfo.block.number;
  trade.isBundle = false;
  trade.save();

  asset.tradeCount++;
  asset.save()

  updateCollectionRevenueMetrics(callInfo, collectionAddr, priceETH, trade.isBundle);
}

function handleBundleTrade(callInfo: AtomicMatch_Call): void {
  let mergedCallData = guardedArrayReplace(callInfo.inputs.calldataBuy, callInfo.inputs.calldataSell, callInfo.inputs.replacementPatternBuy);
  // buyer is buyOrder.maker (addrs[1])
  let buyer = callInfo.inputs.addrs[1].toHexString();
  // seller is sellOrder.maker (addrs[8])
  let seller = callInfo.inputs.addrs[8].toHexString();
  let paymentToken = callInfo.inputs.addrs[13];

  let bundlePriceETH = calculateTradePriceInETH(callInfo, paymentToken);
  let transferResults = decodeBundleNftCallData(mergedCallData);
  let numItems = BigInt.fromI32(transferResults.length).toBigDecimal();
  let avgTradePriceETH = bundlePriceETH.div(numItems);

  for (let i = 0; i < transferResults.length; i++) {
    const result = transferResults[i];
    let saleKind = getSaleKind(callInfo.inputs.feeMethodsSidesKindsHowToCalls[6]);
    let collectionAddr = result.token.toHexString();
    let tokenId = result.tokenId;
    let amount = result.amount;

    getOrCreateUser(seller);
    getOrCreateUser(buyer);
    let assetID = collectionAddr.concat("-").concat(tokenId.toString());
    let asset = getOrCreateAsset(assetID, tokenId, collectionAddr, buyer);

    // Similar to Messari's format
    let tradeID = callInfo.transaction.hash.toHexString().concat("-").concat(result.functionSelector).concat("-").concat(tokenId.toString());
    let trade = new Trade(tradeID);
    trade.transactionHash = callInfo.transaction.hash.toHexString();
    trade.timestamp = callInfo.block.timestamp;
    trade.blockNumber = callInfo.block.number;
    trade.isBundle = true;
    trade.asset = assetID;
    trade.priceETH = avgTradePriceETH;
    trade.amount = amount;
    trade.saleKind = saleKind;
    trade.buyer = buyer;
    trade.seller = seller;
    trade.save();

    asset.tradeCount++;
    asset.save();

    updateCollectionRevenueMetrics(callInfo, collectionAddr, avgTradePriceETH, trade.isBundle);
  }
}

function updateCollectionRevenueMetrics(callInfo: AtomicMatch_Call, collectionAddr: string, priceETH: BigDecimal, isBundle: bool): void {
  let collection = getOrCreateCollection(collectionAddr);
  collection.tradeCount += 1;
  collection.cumulativeTradeVolumeETH = collection.cumulativeTradeVolumeETH.plus(priceETH);

  let sellSideFeeRecipient = callInfo.inputs.addrs[10];
  if (sellSideFeeRecipient.notEqual(NULL_ADDRESS)) {
    // Sell-side order is maker (sale)
    let makerRelayerFee = callInfo.inputs.uints[9];
    // Royalty fee (in percentage) is what is given to the creator of the NFT, minus the fee charged by the exchange
    let creatorRoyaltyFee = EXCHANGE_MARKETPLACE_FEE.le(makerRelayerFee) ? makerRelayerFee.minus(EXCHANGE_MARKETPLACE_FEE).divDecimal(BIGDECIMAL_HUNDRED) : BIGDECIMAL_ZERO;

    // Do not update if bundle sale
    if (collection.royaltyFee.notEqual(creatorRoyaltyFee) && !isBundle)
      collection.royaltyFee = creatorRoyaltyFee;

    let totalRevenueETH = makerRelayerFee.toBigDecimal().times(priceETH).div(INVERSE_BASIS_POINT);
    let marketplaceRevenueETH = EXCHANGE_MARKETPLACE_FEE.le(makerRelayerFee) ? EXCHANGE_MARKETPLACE_FEE.toBigDecimal().times(priceETH).div(INVERSE_BASIS_POINT) : BIGDECIMAL_ZERO;
    let creatorRevenueETH = totalRevenueETH.minus(marketplaceRevenueETH);

    // Update Collection revenues
    collection.totalRevenueETH = collection.totalRevenueETH.plus(totalRevenueETH);
    collection.marketplaceRevenueETH = collection.marketplaceRevenueETH.plus(marketplaceRevenueETH);
    collection.creatorRevenueETH = collection.creatorRevenueETH.plus(creatorRevenueETH);
  } else {
    // Buy-side order is maker (making a bid)
    let takerRelayerFee = callInfo.inputs.uints[1];
    let creatorRoyaltyFee = EXCHANGE_MARKETPLACE_FEE.le(takerRelayerFee) ? takerRelayerFee.minus(EXCHANGE_MARKETPLACE_FEE).divDecimal(BIGDECIMAL_HUNDRED) : BIGDECIMAL_ZERO;

    // Do not update if bundle sale
    if (collection.royaltyFee.notEqual(creatorRoyaltyFee) && !isBundle) collection.royaltyFee = creatorRoyaltyFee;

    let totalRevenueETH = takerRelayerFee.toBigDecimal().times(priceETH).div(INVERSE_BASIS_POINT);
    let marketplaceRevenueETH = EXCHANGE_MARKETPLACE_FEE.le(takerRelayerFee) ? EXCHANGE_MARKETPLACE_FEE.toBigDecimal().times(priceETH).div(INVERSE_BASIS_POINT) : BIGDECIMAL_ZERO;
    let creatorRevenueETH = totalRevenueETH.minus(marketplaceRevenueETH);

    // Update Collection revenue
    collection.creatorRevenueETH = collection.creatorRevenueETH.plus(creatorRevenueETH);
    collection.marketplaceRevenueETH = collection.marketplaceRevenueETH.plus(marketplaceRevenueETH);
    collection.totalRevenueETH = collection.totalRevenueETH.plus(totalRevenueETH);
  }

  collection.save();
}
