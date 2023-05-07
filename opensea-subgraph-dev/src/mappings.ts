import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { AtomicMatch_Call } from "../generated/OpenSea/OpenSea";
import { Trade } from "../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  EXCHANGE_MARKETPLACE_FEE,
  INVERSE_BASIS_POINT,
  NULL_ADDRESS,
  WYVERN_ATOMICIZER_ADDRESS,
} from "./constants";
import { calculateTradePriceETH, decodeBundleNftTransferResults, decodeSingleTransferResult, getOrCreateAsset, getOrCreateCollection, getSaleKind, guardedArrayReplace } from "./utils";

// Note that callHandlers won't be invoked by failed transactions. This means whenever our handler is
// invoked, we must be working with a valid transaction.
// Ref: https://github.com/graphprotocol/graph-node/pull/4149
export function handleAtomicMatch(call: AtomicMatch_Call): void {
  let sellTarget = call.inputs.addrs[11];
  if (sellTarget.equals(WYVERN_ATOMICIZER_ADDRESS)) {
    handleBundleOrder(call);
  } else {
    handleSingleOrder(call);
  }
}

function handleSingleOrder(call: AtomicMatch_Call): void {
  let collectionAddrs: string[] = [];
  let paymentToken = call.inputs.addrs[13];

  let mergedCallData = guardedArrayReplace(
    call.inputs.calldataBuy,
    call.inputs.calldataSell,
    call.inputs.replacementPatternBuy
  );

  let decodedTransferResult = decodeSingleTransferResult(call, mergedCallData);
  if (!decodedTransferResult) {
    return;
  }

  let buyer = decodedTransferResult.to.toHexString();
  let seller = decodedTransferResult.from.toHexString();
  let collectionAddr = decodedTransferResult.token.toHexString();
  let tokenId = decodedTransferResult.tokenId;
  let amount = decodedTransferResult.amount;
  let saleKind = getSaleKind(call.inputs.feeMethodsSidesKindsHowToCalls[6]);
  let priceETH = calculateTradePriceETH(call, paymentToken);

  collectionAddrs.push(collectionAddr);

  let assetID = collectionAddr.concat("-").concat(tokenId.toString())
  getOrCreateAsset(assetID, tokenId, collectionAddr)

  let tradeID = call.transaction.hash
    .toHexString()
    .concat("-")
    .concat(decodedTransferResult.functionSelector)
    .concat("-")
    .concat(tokenId.toString());
  let trade = new Trade(tradeID);
  trade.transactionHash = call.transaction.hash.toHexString();
  trade.timestamp = call.block.timestamp;
  trade.blockNumber = call.block.number;
  trade.isBundle = false;
  trade.asset = assetID;
  trade.priceETH = priceETH;
  trade.amount = amount;
  trade.saleKind = saleKind;
  trade.buyer = buyer;
  trade.seller = seller;
  trade.save();

  updateCollectionRevenueMetrics(
    call,
    collectionAddr,
    priceETH,
    trade.isBundle
  );
}

function handleBundleOrder(call: AtomicMatch_Call): void {
  let collectionAddrs: string[] = [];

  // buyer is buyOrder.maker (addrs[1])
  let buyer = call.inputs.addrs[1].toHexString();
  // seller is sellOrder.maker (addrs[8])
  let seller = call.inputs.addrs[8].toHexString();
  // paymentToken is buyOrder.paymentToken or SellOrder.payment token (addrs[6] or addrs[13])
  let paymentToken = call.inputs.addrs[13];

  let bundlePriceETH = calculateTradePriceETH(call, paymentToken);

  let mergedCallData = guardedArrayReplace(
    call.inputs.calldataBuy,
    call.inputs.calldataSell,
    call.inputs.replacementPatternBuy
  );

  let decodedTransferResults = decodeBundleNftTransferResults(mergedCallData);
  let tradeSize = BigInt.fromI32(decodedTransferResults.length).toBigDecimal();
  for (let i = 0; i < decodedTransferResults.length; i++) {
    let collectionAddr = decodedTransferResults[i].token.toHexString();
    let tokenId = decodedTransferResults[i].tokenId;
    let amount = decodedTransferResults[i].amount;
    let saleKind = getSaleKind(call.inputs.feeMethodsSidesKindsHowToCalls[6]);
    let avgTradePriceETH = bundlePriceETH.div(tradeSize);

    collectionAddrs.push(collectionAddr);

    let assetID = collectionAddr.concat("-").concat(tokenId.toString())
    getOrCreateAsset(assetID, tokenId, collectionAddr)

    let tradeID = call.transaction.hash
      .toHexString()
      .concat("-")
      .concat(decodedTransferResults[i].functionSelector)
      .concat("-")
      .concat(tokenId.toString());
    let trade = new Trade(tradeID);
    trade.transactionHash = call.transaction.hash.toHexString();
    trade.timestamp = call.block.timestamp;
    trade.blockNumber = call.block.number;
    trade.isBundle = true;
    trade.asset = assetID;
    trade.priceETH = avgTradePriceETH;
    trade.amount = amount;
    trade.saleKind = saleKind;
    trade.buyer = buyer;
    trade.seller = seller;
    trade.save();

    updateCollectionRevenueMetrics(
      call,
      collectionAddr,
      avgTradePriceETH,
      trade.isBundle
    );
  }
}

function updateCollectionRevenueMetrics(
  call: AtomicMatch_Call,
  collectionAddr: string,
  priceETH: BigDecimal,
  isBundle: bool
): void {
  let collection = getOrCreateCollection(collectionAddr);
  collection.tradeCount += 1;

  collection.cumulativeTradeVolumeETH =
    collection.cumulativeTradeVolumeETH.plus(priceETH);

  let sellSideFeeRecipient = call.inputs.addrs[10];

  // This logic reproduces the OpenSea exchange logic here:
  // https://github.com/ProjectWyvern/wyvern-ethereum/blob/master/contracts/exchange/ExchangeCore.sol#L507
  if (sellSideFeeRecipient.notEqual(NULL_ADDRESS)) {
    // Sell-side order is maker (sale)
    let makerRelayerFee = call.inputs.uints[9];
    let creatorRoyaltyFeePercentage = EXCHANGE_MARKETPLACE_FEE.le(
      makerRelayerFee
    )
      ? makerRelayerFee
        .minus(EXCHANGE_MARKETPLACE_FEE)
        .divDecimal(BIGDECIMAL_HUNDRED)
      : BIGDECIMAL_ZERO;

    // Do not update if bundle sale
    if (
      collection.royaltyFee.notEqual(creatorRoyaltyFeePercentage) &&
      !isBundle
    ) {
      collection.royaltyFee = creatorRoyaltyFeePercentage;
    }

    let totalRevenueETH = makerRelayerFee
      .toBigDecimal()
      .times(priceETH)
      .div(INVERSE_BASIS_POINT);
    let marketplaceRevenueETH = EXCHANGE_MARKETPLACE_FEE.le(makerRelayerFee)
      ? EXCHANGE_MARKETPLACE_FEE.toBigDecimal()
        .times(priceETH)
        .div(INVERSE_BASIS_POINT)
      : BIGDECIMAL_ZERO;
    let creatorRevenueETH = totalRevenueETH.minus(marketplaceRevenueETH);

    // Update Collection revenue
    collection.totalRevenueETH =
      collection.totalRevenueETH.plus(totalRevenueETH);
    collection.marketplaceRevenueETH = collection.marketplaceRevenueETH.plus(
      marketplaceRevenueETH
    );
    collection.creatorRevenueETH =
      collection.creatorRevenueETH.plus(creatorRevenueETH);
  } else {
    // Buy-side order is maker (bid/offer)
    let takerRelayerFee = call.inputs.uints[1];
    let creatorRoyaltyFeePercentage = EXCHANGE_MARKETPLACE_FEE.le(
      takerRelayerFee
    )
      ? takerRelayerFee
        .minus(EXCHANGE_MARKETPLACE_FEE)
        .divDecimal(BIGDECIMAL_HUNDRED)
      : BIGDECIMAL_ZERO;

    // Do not update if bundle sale
    if (
      collection.royaltyFee.notEqual(creatorRoyaltyFeePercentage) &&
      !isBundle
    ) {
      collection.royaltyFee = creatorRoyaltyFeePercentage;
    }

    let totalRevenueETH = takerRelayerFee
      .toBigDecimal()
      .times(priceETH)
      .div(INVERSE_BASIS_POINT);
    let marketplaceRevenueETH = EXCHANGE_MARKETPLACE_FEE.le(takerRelayerFee)
      ? EXCHANGE_MARKETPLACE_FEE.toBigDecimal()
        .times(priceETH)
        .div(INVERSE_BASIS_POINT)
      : BIGDECIMAL_ZERO;
    let creatorRevenueETH = totalRevenueETH.minus(marketplaceRevenueETH);

    // Update Collection revenue
    collection.totalRevenueETH =
      collection.totalRevenueETH.plus(totalRevenueETH);
    collection.marketplaceRevenueETH = collection.marketplaceRevenueETH.plus(
      marketplaceRevenueETH
    );
    collection.creatorRevenueETH =
      collection.creatorRevenueETH.plus(creatorRevenueETH);
  }

  collection.save();
}
