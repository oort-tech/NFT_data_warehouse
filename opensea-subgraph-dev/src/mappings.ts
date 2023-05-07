import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { AtomicMatch_Call } from "../generated/OpenSea/OpenSea";
import { Trade } from "../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  EXCHANGE_MARKETPLACE_FEE,
  INVERSE_BASIS_POINT,
  NULL_ADDRESS,
  SaleStrategy,
  SECONDS_PER_DAY,
  WYVERN_ATOMICIZER_ADDRESS,
} from "./constants";
import {
  calcTradePriceETH,
  decodeSingleNftData,
  decodeBundleNftData,
  getOrCreateCollection,
  getOrCreateAsset,
} from "./helpers";
import { getSaleStrategy, guardedArrayReplace, min, max } from "./utils";

/**
 * Order struct as found in the Project Wyvern official source
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/ExchangeCore.sol#L92
 */
// struct Order {
//   /* Exchange address, intended as a versioning mechanism. */
//   address exchange;
//   /* Order maker address. */
//   address maker;
//   /* Order taker address, if specified. */
//   address taker;
//   /* Maker relayer fee of the order, unused for taker order. */
//   uint makerRelayerFee;
//   /* Taker relayer fee of the order, or maximum taker fee for a taker order. */
//   uint takerRelayerFee;
//   /* Maker protocol fee of the order, unused for taker order. */
//   uint makerProtocolFee;
//   /* Taker protocol fee of the order, or maximum taker fee for a taker order. */
//   uint takerProtocolFee;
//   /* Order fee recipient or zero address for taker order. */
//   address feeRecipient;
//   /* Fee method (protocol token or split fee). */
//   FeeMethod feeMethod;
//   /* Side (buy/sell). */
//   SaleKindInterface.Side side;
//   /* Kind of sale. */
//   SaleKindInterface.SaleKind saleKind;
//   /* Target. */
//   address target;
//   /* HowToCall. */
//   AuthenticatedProxy.HowToCall howToCall;
//   /* Calldata. */
//   bytes calldata;
//   /* Calldata replacement pattern, or an empty byte array for no replacement. */
//   bytes replacementPattern;
//   /* Static call target, zero-address for no static call. */
//   address staticTarget;
//   /* Static call extra data. */
//   bytes staticExtradata;
//   /* Token used to pay for the order, or the zero-address as a sentinel value for Ether. */
//   address paymentToken;
//   /* Base price of the order (in paymentTokens). */
//   uint basePrice;
//   /* Auction extra parameter - minimum bid increment for English auctions, starting/ending price difference. */
//   uint extra;
//   /* Listing timestamp. */
//   uint listingTime;
//   /* Expiration timestamp - 0 for no expiry. */
//   uint expirationTime;
//   /* Order salt, used to prevent duplicate hashes. */
//   uint salt;
//   /* NOTE: uint nonce is an additional component of the order but is read from storage */
// }

/**
 * atomicMatch method signature as found in the Project Wyvern official source
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/ExchangeCore.sol#L665
 *
 * atomicMatch(Order memory buy, Sig memory buySig, Order memory sell, Sig memory sellSig, bytes32 metadata)
 *
 * atomicMatch parameters matched with labels of call inputs
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/Exchange.sol#L333
 *
 * - buy: Order(addrs[0] exchange, addrs[1] maker, addrs[2] taker, uints[0] makerRelayerFee, uints[1] takerRelayerFee, uints[2] makerProtocolFee, uints[3] takerProtocolFee, addrs[3] feeRecipient, FeeMethod(feeMethodsSidesKindsHowToCalls[0]) feeMethod, SaleKindInterface.Side(feeMethodsSidesKindsHowToCalls[1]) side, SaleKindInterface.SaleKind(feeMethodsSidesKindsHowToCalls[2]) sideKind, addrs[4] target, AuthenticatedProxy.HowToCall(feeMethodsSidesKindsHowToCalls[3]) howToCall, calldataBuy calldata, replacementPatternBuy replacementPattern, addrs[5] staticTarget, staticExtradataBuy staticExtradata, ERC20(addrs[6]) paymentToken, uints[4] basePrice, uints[5] extra, uints[6] listingTime, uints[7] expirationTime, uints[8] salt),
 * - buySig: Sig(vs[0], rssMetadata[0], rssMetadata[1]),
 * - sell: Order(addrs[7] exchange, addrs[8] maker, addrs[9] taker, uints[9] makerRelayerFee, uints[10] takerRelayerFee, uints[11] makerProtocolFee, uints[12] takerProtocolFee, addrs[10] feeRecipient, FeeMethod(feeMethodsSidesKindsHowToCalls[4]) feeMethod, SaleKindInterface.Side(feeMethodsSidesKindsHowToCalls[5]) side, SaleKindInterface.SaleKind(feeMethodsSidesKindsHowToCalls[6]) sideKind, addrs[11] target, AuthenticatedProxy.HowToCall(feeMethodsSidesKindsHowToCalls[7]) howToCall, calldataSell calldata, replacementPatternSell replacementPattern, addrs[12] staticTarget, staticExtradataSell staticExtradata, ERC20(addrs[13]) paymentToken, uints[13] basePrice, uints[14] extra, uints[15] listingTime, uints[16] expirationTime, uints[17] salt),
 * - sellSig: Sig(vs[1], rssMetadata[2], rssMetadata[3]),
 * - metadata: rssMetadata[4]
 *
 * Lookup table for addrs[14]
 * - addrs[0] buy.exchange
 * - addrs[1] buy.maker
 * - addrs[2] buy.taker
 * - addrs[3] buy.feeRecipient
 * - addrs[4] buy.target
 * - addrs[5] buy.staticTarget
 * - addrs[6] buy.paymentToken
 * - addrs[7] sell.exchange
 * - addrs[8] sell.maker
 * - addrs[9] sell.taker
 * - addrs[10] sell.feeRecipient
 * - addrs[11] sell.target
 * - addrs[12] sell.staticTarget
 * - addrs[13] sell.paymentToken
 *
 * Lookup table for uints[18]
 * - uints[0] buy.makerRelayerFee
 * - uints[1] buy.takerRelayerFee
 * - uints[2] buy.makerProtocolFee
 * - uints[3] buy.takerProtocolFee
 * - uints[4] buy.basePrice
 * - uints[5] buy.extra
 * - uints[6] buy.listingTime
 * - uints[7] buy.expirationTime
 * - uints[8] buy.salt
 * - uints[9] sell.makerRelayerFee
 * - uints[10] sell.takerRelayerFee
 * - uints[11] sell.makerProtocolFee
 * - uints[12] sell.takerProtocolFee
 * - uints[13] sell.basePrice
 * - uints[14] sell.extra
 * - uints[15] sell.listingTime
 * - uints[16] sell.expirationTime
 * - uints[17] sell.salt
 *
 * Lookup table for feeMethodsSidesKindsHowToCalls[8]
 * - feeMethodsSidesKindsHowToCalls[0] buy.feeMethod
 * - feeMethodsSidesKindsHowToCalls[1] buy.side
 * - feeMethodsSidesKindsHowToCalls[2] buy.saleKind
 * - feeMethodsSidesKindsHowToCalls[3] buy.howToCall
 * - feeMethodsSidesKindsHowToCalls[4] sell.feeMethod
 * - feeMethodsSidesKindsHowToCalls[5] sell.side
 * - feeMethodsSidesKindsHowToCalls[6] sell.saleKind
 * - feeMethodsSidesKindsHowToCalls[7] sell.howToCall
 */

export function handleMatch(call: AtomicMatch_Call): void {
  // sellTarget is sell.target (addrs[11])
  let sellTarget = call.inputs.addrs[11];
  if (sellTarget.equals(WYVERN_ATOMICIZER_ADDRESS)) {
    handleBundleSale(call);
  } else {
    handleSingleSale(call);
  }
}

function handleSingleSale(call: AtomicMatch_Call): void {
  let collectionAddrs: string[] = [];

  // paymentToken is buyOrder.paymentToken or SellOrder.payment token (addrs[6] or addrs[13])
  let paymentToken = call.inputs.addrs[13];

  let mergedCallData = guardedArrayReplace(
    call.inputs.calldataBuy,
    call.inputs.calldataSell,
    call.inputs.replacementPatternBuy
  );

  let decodedTransferResult = decodeSingleNftData(call, mergedCallData);
  if (!decodedTransferResult) {
    return;
  }

  let buyer = decodedTransferResult.to.toHexString();
  let seller = decodedTransferResult.from.toHexString();
  let collectionAddr = decodedTransferResult.token.toHexString();
  let tokenId = decodedTransferResult.tokenId;
  let amount = decodedTransferResult.amount;
  let saleKind = call.inputs.feeMethodsSidesKindsHowToCalls[6];
  let strategy = getSaleStrategy(saleKind);
  let priceETH = calcTradePriceETH(call, paymentToken);

  collectionAddrs.push(collectionAddr);

  if (buyer != call.inputs.addrs[1].toHexString()) {
    log.debug(
      "buyMaker/receiver do not match, isBundle: {}, buyMaker: {}, reciever: {}, tx: {}",
      [
        false.toString(),
        call.inputs.addrs[1].toHexString(),
        buyer,
        call.transaction.hash.toHexString(),
      ]
    );
  }

  if (seller != call.inputs.addrs[8].toHexString()) {
    log.debug(
      "sellMaker/sender do not match, isBundle: {}, sellMaker: {}, sender: {}, tx: {}",
      [
        false.toString(),
        call.inputs.addrs[8].toHexString(),
        seller,
        call.transaction.hash.toHexString(),
      ]
    );
  }

  let assetID = collectionAddr.concat("-").concat(tokenId.toString())
  getOrCreateAsset(assetID, tokenId, collectionAddr)

  // No event log index since this is a contract call
  let tradeID = call.transaction.hash
    .toHexString()
    .concat("-")
    .concat(decodedTransferResult.method)
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
  trade.strategy = strategy;
  trade.buyer = buyer;
  trade.seller = seller;
  trade.save();

  // Update Collection and daily snapshot
  updateCollectionMetrics(
    call,
    collectionAddr,
    priceETH,
    trade.isBundle
  );
}

function handleBundleSale(call: AtomicMatch_Call): void {
  let collectionAddrs: string[] = [];

  // buyer is buyOrder.maker (addrs[1])
  let buyer = call.inputs.addrs[1].toHexString();
  // seller is sellOrder.maker (addrs[8])
  let seller = call.inputs.addrs[8].toHexString();
  // paymentToken is buyOrder.paymentToken or SellOrder.payment token (addrs[6] or addrs[13])
  let paymentToken = call.inputs.addrs[13];

  let bundlePriceETH = calcTradePriceETH(call, paymentToken);

  let mergedCallData = guardedArrayReplace(
    call.inputs.calldataBuy,
    call.inputs.calldataSell,
    call.inputs.replacementPatternBuy
  );

  let decodedTransferResults = decodeBundleNftData(call, mergedCallData);
  let tradeSize = BigInt.fromI32(decodedTransferResults.length).toBigDecimal();
  for (let i = 0; i < decodedTransferResults.length; i++) {
    let collectionAddr = decodedTransferResults[i].token.toHexString();
    let tokenId = decodedTransferResults[i].tokenId;
    let amount = decodedTransferResults[i].amount;
    let saleKind = call.inputs.feeMethodsSidesKindsHowToCalls[6];
    let strategy = getSaleStrategy(saleKind);
    // Average price of token in bundle
    let avgTradePriceETH = bundlePriceETH.div(tradeSize);

    collectionAddrs.push(collectionAddr);

    if (strategy == SaleStrategy.DUTCH_AUCTION) {
      log.debug("dutch auction sale in a bundle sale, transaction: {}", [
        call.transaction.hash.toHexString(),
      ]);
    }

    if (buyer != decodedTransferResults[i].to.toHexString()) {
      log.warning(
        "buyMaker/receiver do not match, isBundle: {}, buyMaker: {}, reciever: {}, tx: {}",
        [
          true.toString(),
          buyer,
          decodedTransferResults[i].to.toHexString(),
          call.transaction.hash.toHexString(),
        ]
      );
    }

    if (seller != decodedTransferResults[i].from.toHexString()) {
      log.warning(
        "sellMaker/sender do not match, isBundle: {}, sellMaker: {}, sender: {}, tx: {}",
        [
          true.toString(),
          seller,
          decodedTransferResults[i].from.toHexString(),
          call.transaction.hash.toHexString(),
        ]
      );
    }

    let assetID = collectionAddr.concat("-").concat(tokenId.toString())
    getOrCreateAsset(assetID, tokenId, collectionAddr)

    // No event log index since this is a contract call
    let tradeID = call.transaction.hash
      .toHexString()
      .concat("-")
      .concat(decodedTransferResults[i].method)
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
    trade.strategy = strategy;
    trade.buyer = buyer;
    trade.seller = seller;
    trade.save();

    // Update Collection and daily snapshot
    updateCollectionMetrics(
      call,
      collectionAddr,
      avgTradePriceETH,
      trade.isBundle
    );
  }
}

function updateCollectionMetrics(
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
