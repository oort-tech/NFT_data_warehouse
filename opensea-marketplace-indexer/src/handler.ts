import { log, BigInt, Address, Bytes } from "@graphprotocol/graph-ts";
import {
  OrderFulfilled,
  OrderFulfilledConsiderationStruct,
  OrderFulfilledOfferStruct,
} from "../generated/Seaport/Seaport";
import {
  Collection,
  CollectionDailySnapshot,
  Marketplace,
  MarketplaceDailySnapshot,
  _OrderFulfillment,
  Trade,
  _Item,
} from "../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_MAX,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  orderFulfillmentMethod,
  tradeStrategy,
  ERC1155_INTERFACE_IDENTIFIER,
  ERC721_INTERFACE_IDENTIFIER,
  isERC1155,
  isERC721,
  isMoney,
  isNFT,
  isOpenSeaFeeAccount,
  MANTISSA_FACTOR,
  max,
  min,
  NFTStandards,
  SECONDS_PER_DAY,
} from "./utils";
import { NFTMetadata } from "../generated/Seaport/NFTMetadata";
import { ERC165 } from "../generated/Seaport/ERC165";
import { NetworkConfigs } from "../configurations/configure";

// These are objects that serve as dataclasses. They are similar to the objects created by codegen, 
// but they are not defined as entities in the graphql schema
export class Sale {
  constructor(
    public readonly buyer: Address,
    public readonly seller: Address,
    public readonly nfts: NFTs,
    public readonly money: Money,
    public readonly fees: Fees
  ) {}
}

export class NFTs {
  constructor(
    public readonly tokenAddress: Address,
    public readonly standard: string,
    public readonly tokenIds: Array<BigInt>,
    public readonly amounts: Array<BigInt>
  ) {}
}

export class Money {
  constructor(public readonly amount: BigInt) {}
}

export class Fees {
  constructor(
    public readonly protocolRevenue: BigInt,
    public readonly creatorRevenue: BigInt
  ) {}
}

// Offers and Consideration have information about NFTs, the price, the fees that go to OpenSea, and the royalty fees
// if the offer contains the NFT, then the offerer is the seller. As a result, the price, opensea fees, and royalty fee will be in consideration.
// if consideration contains the NFT, the the recipient is the seller. As a result, the price, opensea fees, and royalty fee will be in offer.
export function handleOrderFulfilled(event: OrderFulfilled): void {
  // parameters for order fulfilled defined here: https://docs.opensea.io/reference/seaport-events-and-errors
  const offerer = event.params.offerer;
  const recipient = event.params.recipient;
  const offer = event.params.offer;
  const consideration = event.params.consideration;

  // use the above parameters to figure out what NFT's were involved in the transfer and who the buyer and sellers are
  const saleResult = getTransferDetails(offerer, recipient, offer, consideration);
  if (!saleResult) {
    return;
  }

  const tokenAddress = saleResult.nfts.tokenAddress.toHexString(); 
  const collection = getCollection(tokenAddress);
  const buyer = saleResult.buyer.toHexString();
  const seller = saleResult.seller.toHexString();
  const royaltyFee = saleResult.fees.creatorRevenue
    .toBigDecimal()
    .div(saleResult.money.amount.toBigDecimal())
    .times(BIGDECIMAL_HUNDRED);
  const totalNftAmount = saleResult.nfts.amounts.reduce(
    (acc, curr) => acc.plus(curr),
    BIGINT_ZERO
  );
  const volumeETH = saleResult.money.amount.toBigDecimal().div(MANTISSA_FACTOR);
  const priceETH = volumeETH.div(totalNftAmount.toBigDecimal());

  //
  // new trade
  //
  const nNewTrade = saleResult.nfts.tokenIds.length;
  for (let i = 0; i < nNewTrade; i++) {
    const tradeID = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.logIndex.toString());

    const trade = new Trade(tradeID);
    trade.transactionHash = event.transaction.hash.toHexString();
    trade.logIndex = event.logIndex.toI32();
    trade.timestamp = event.block.timestamp;
    trade.blockNumber = event.block.number;
    trade.collection = tokenAddress;
    trade.tokenId = saleResult.nfts.tokenIds[i];
    trade.priceETH = priceETH;
    trade.amount = saleResult.nfts.amounts[i];
    // if it is a basic order then STANDARD_SALE
    // otherwise ANY_ITEM_FROM_SET. 
    // TODO: ANY_ITEM_FROM_SET correct strategy? Cannot find docs on how to decide
    trade.strategy = tradeStrategy(event);
    trade.buyer = buyer;
    trade.seller = seller;
    trade.save();

    // Save details of how trade was fulfilled
    const orderFulfillment = new _OrderFulfillment(tradeID);
    orderFulfillment.trade = tradeID;
    orderFulfillment.orderFulfillmentMethod = orderFulfillmentMethod(event)
    orderFulfillment.save()
  }

  //
  // update collection
  //
  collection.tradeCount += nNewTrade;
  collection.royaltyFee = royaltyFee;
  const buyerCollectionAccountID = "COLLECTION_ACCOUNT-BUYER-"
    .concat(collection.id)
    .concat("-")
    .concat(buyer);
  let buyerCollectionAccount = _Item.load(buyerCollectionAccountID);
  if (!buyerCollectionAccount) {
    buyerCollectionAccount = new _Item(buyerCollectionAccountID);
    buyerCollectionAccount.save();
    collection.buyerCount += 1;
  }
  const sellerCollectionAccountID = "COLLECTION_ACCOUNT-SELLER-"
    .concat(collection.id)
    .concat("-")
    .concat(seller);
  let sellerCollectionAccount = _Item.load(sellerCollectionAccountID);
  if (!sellerCollectionAccount) {
    sellerCollectionAccount = new _Item(sellerCollectionAccountID);
    sellerCollectionAccount.save();
    collection.sellerCount += 1;
  }
  collection.cumulativeTradeVolumeETH =
    collection.cumulativeTradeVolumeETH.plus(volumeETH);
  const deltaMarketplaceRevenueETH = saleResult.fees.protocolRevenue
    .toBigDecimal()
    .div(MANTISSA_FACTOR);
  const deltaCreatorRevenueETH = saleResult.fees.creatorRevenue
    .toBigDecimal()
    .div(MANTISSA_FACTOR);
  collection.marketplaceRevenueETH = collection.marketplaceRevenueETH.plus(
    deltaMarketplaceRevenueETH
  );
  collection.creatorRevenueETH = collection.creatorRevenueETH.plus(
    deltaCreatorRevenueETH
  );
  collection.totalRevenueETH = collection.marketplaceRevenueETH.plus(
    collection.creatorRevenueETH
  );
  collection.save();

  //
  // update marketplace
  //
  const marketplace = getMarketplace(
    NetworkConfigs.getMarketplaceAddress()
  );
  marketplace.tradeCount += 1;
  marketplace.cumulativeTradeVolumeETH =
    marketplace.cumulativeTradeVolumeETH.plus(volumeETH);
  marketplace.marketplaceRevenueETH = marketplace.marketplaceRevenueETH.plus(
    deltaMarketplaceRevenueETH
  );
  marketplace.creatorRevenueETH = marketplace.creatorRevenueETH.plus(
    deltaCreatorRevenueETH
  );
  marketplace.totalRevenueETH = marketplace.marketplaceRevenueETH.plus(
    marketplace.creatorRevenueETH
  );
  const buyerAccountID = "MARKETPLACE_ACCOUNT-".concat(buyer);
  let buyerAccount = _Item.load(buyerAccountID);
  if (!buyerAccount) {
    buyerAccount = new _Item(buyerAccountID);
    buyerAccount.save();
    marketplace.cumulativeUniqueTraders += 1;
  }
  const sellerAccountID = "MARKETPLACE_ACCOUNT-".concat(seller);
  let sellerAccount = _Item.load(sellerAccountID);
  if (!sellerAccount) {
    sellerAccount = new _Item(sellerAccountID);
    sellerAccount.save();
    marketplace.cumulativeUniqueTraders += 1;
  }
  marketplace.save();

  // prepare for updating dailyTradedItemCount
  let newDailyTradedItem = 0;
  for (let i = 0; i < nNewTrade; i++) {
    const dailyTradedItemID = "DAILY_TRADED_ITEM-"
      .concat(tokenAddress)
      .concat("-")
      .concat(saleResult.nfts.tokenIds[i].toString())
      .concat("-")
      .concat((event.block.timestamp.toI32() / SECONDS_PER_DAY).toString());
    let dailyTradedItem = _Item.load(dailyTradedItemID);
    if (!dailyTradedItem) {
      dailyTradedItem = new _Item(dailyTradedItemID);
      dailyTradedItem.save();
      newDailyTradedItem++;
    }
  }
  //
  // take collection snapshot
  //
  const collectionSnapshot = getOrCreateCollectionDailySnapshot(
    tokenAddress,
    event.block.timestamp
  );
  collectionSnapshot.blockNumber = event.block.number;
  collectionSnapshot.timestamp = event.block.timestamp;
  collectionSnapshot.royaltyFee = collection.royaltyFee;
  collectionSnapshot.dailyMinSalePrice = min(
    collectionSnapshot.dailyMinSalePrice,
    priceETH
  );
  collectionSnapshot.dailyMaxSalePrice = max(
    collectionSnapshot.dailyMaxSalePrice,
    priceETH
  );
  collectionSnapshot.cumulativeTradeVolumeETH =
    collection.cumulativeTradeVolumeETH;
  collectionSnapshot.marketplaceRevenueETH = collection.marketplaceRevenueETH;
  collectionSnapshot.creatorRevenueETH = collection.creatorRevenueETH;
  collectionSnapshot.totalRevenueETH = collection.totalRevenueETH;
  collectionSnapshot.tradeCount = collection.tradeCount;
  collectionSnapshot.dailyTradeVolumeETH =
    collectionSnapshot.dailyTradeVolumeETH.plus(volumeETH);
  collectionSnapshot.dailyTradedItemCount += newDailyTradedItem;
  collectionSnapshot.save();

  //
  // take marketplace snapshot
  //
  const marketplaceSnapshot = getOrCreateMarketplaceDailySnapshot(
    event.block.timestamp
  );
  marketplaceSnapshot.blockNumber = event.block.number;
  marketplaceSnapshot.timestamp = event.block.timestamp;
  marketplaceSnapshot.collectionCount = marketplace.collectionCount;
  marketplaceSnapshot.cumulativeTradeVolumeETH =
    marketplace.cumulativeTradeVolumeETH;
  marketplaceSnapshot.marketplaceRevenueETH = marketplace.marketplaceRevenueETH;
  marketplaceSnapshot.creatorRevenueETH = marketplace.creatorRevenueETH;
  marketplaceSnapshot.totalRevenueETH = marketplace.totalRevenueETH;
  marketplaceSnapshot.tradeCount = marketplace.tradeCount;
  marketplaceSnapshot.cumulativeUniqueTraders =
    marketplace.cumulativeUniqueTraders;
  const dailyBuyerID = "DAILY_MARKERPLACE_ACCOUNT-".concat(buyer);
  let dailyBuyer = _Item.load(dailyBuyerID);
  if (!dailyBuyer) {
    dailyBuyer = new _Item(dailyBuyerID);
    dailyBuyer.save();
    marketplaceSnapshot.dailyActiveTraders += 1;
  }
  const dailySellerID = "DAILY_MARKETPLACE_ACCOUNT-".concat(seller);
  let dailySeller = _Item.load(dailySellerID);
  if (!dailySeller) {
    dailySeller = new _Item(dailySellerID);
    dailySeller.save();
    marketplaceSnapshot.dailyActiveTraders += 1;
  }
  const dailyTradedCollectionID = "DAILY_TRADED_COLLECTION-"
    .concat(tokenAddress)
    .concat("-")
    .concat((event.block.timestamp.toI32() / SECONDS_PER_DAY).toString());
  let dailyTradedCollection = _Item.load(dailyTradedCollectionID);
  if (!dailyTradedCollection) {
    dailyTradedCollection = new _Item(dailyTradedCollectionID);
    dailyTradedCollection.save();
    marketplaceSnapshot.dailyTradedCollectionCount += 1;
  }
  marketplaceSnapshot.dailyTradedItemCount += newDailyTradedItem;
  marketplaceSnapshot.save();
}

export function getCollection(tokenAddress: string): Collection {
  let collection = Collection.load(tokenAddress);

  // if the collection hasn't been saved before, we will need to instantiate it and save it for the first time in the event handler.
  if (!collection) { 
    collection = new Collection(tokenAddress);
    collection.nftStandard = getNftStandard(tokenAddress);
    const contract = NFTMetadata.bind(Address.fromString(tokenAddress));
    
    // We can conveniently try getting the name, symbol, and total supply of an NFT using the generated code. 
    // This probably uses the attributes available in the NFTMetadata ABI.
    const name = contract.try_name(); 
    if (!name.reverted) { // if the name is not present, it will show as null
      collection.name = name.value;
    }
    const symbol = contract.try_symbol();
    if (!symbol.reverted) { // if the symbol is not present, it will show as null
      collection.symbol = symbol.value;
    }
    const totalSupply = contract.try_totalSupply();
    if (!totalSupply.reverted) { // if the supply is not present, it will show as null
      collection.totalSupply = totalSupply.value;
    }
    
    // Not exactly sure why we need to save the collection to the indexer's database here if we are saving
    // it again in the event handler. 
    collection.royaltyFee = BIGDECIMAL_ZERO;
    collection.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
    collection.marketplaceRevenueETH = BIGDECIMAL_ZERO;
    collection.creatorRevenueETH = BIGDECIMAL_ZERO;
    collection.totalRevenueETH = BIGDECIMAL_ZERO;
    collection.tradeCount = 0;
    collection.buyerCount = 0;
    collection.sellerCount = 0;
    collection.save();

    const marketplace = getMarketplace(
      NetworkConfigs.getMarketplaceAddress()
    );
    marketplace.collectionCount += 1;
    marketplace.save();
  }
  return collection;
}

export function getMarketplace(marketplaceID: string): Marketplace {
  let marketplace = Marketplace.load(marketplaceID);
  if (!marketplace) {
    marketplace = new Marketplace(marketplaceID);
    marketplace.name = NetworkConfigs.getProtocolName();
    marketplace.slug = NetworkConfigs.getProtocolSlug();
    marketplace.network = NetworkConfigs.getNetwork();
    marketplace.schemaVersion = NetworkConfigs.getSchemaVersion();
    marketplace.subgraphVersion = NetworkConfigs.getSubgraphVersion();
    marketplace.methodologyVersion = NetworkConfigs.getMethodologyVersion();
    marketplace.collectionCount = 0;
    marketplace.tradeCount = 0;
    marketplace.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
    marketplace.marketplaceRevenueETH = BIGDECIMAL_ZERO;
    marketplace.creatorRevenueETH = BIGDECIMAL_ZERO;
    marketplace.totalRevenueETH = BIGDECIMAL_ZERO;
    marketplace.cumulativeUniqueTraders = 0;
    marketplace.save();
  }
  return marketplace;
}

export function getOrCreateCollectionDailySnapshot(
  collection: string,
  timestamp: BigInt
): CollectionDailySnapshot {
  const snapshotID = collection
    .concat("-")
    .concat((timestamp.toI32() / SECONDS_PER_DAY).toString());
  let snapshot = CollectionDailySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new CollectionDailySnapshot(snapshotID);
    snapshot.collection = collection;
    snapshot.blockNumber = BIGINT_ZERO;
    snapshot.timestamp = BIGINT_ZERO;
    snapshot.royaltyFee = BIGDECIMAL_ZERO;
    snapshot.dailyMinSalePrice = BIGDECIMAL_MAX;
    snapshot.dailyMaxSalePrice = BIGDECIMAL_ZERO;
    snapshot.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
    snapshot.dailyTradeVolumeETH = BIGDECIMAL_ZERO;
    snapshot.marketplaceRevenueETH = BIGDECIMAL_ZERO;
    snapshot.creatorRevenueETH = BIGDECIMAL_ZERO;
    snapshot.totalRevenueETH = BIGDECIMAL_ZERO;
    snapshot.tradeCount = 0;
    snapshot.dailyTradedItemCount = 0;
    snapshot.save();
  }
  return snapshot;
}

export function getOrCreateMarketplaceDailySnapshot(
  timestamp: BigInt
): MarketplaceDailySnapshot {
  const snapshotID = (timestamp.toI32() / SECONDS_PER_DAY).toString();
  let snapshot = MarketplaceDailySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new MarketplaceDailySnapshot(snapshotID);
    snapshot.marketplace = NetworkConfigs.getMarketplaceAddress();
    snapshot.blockNumber = BIGINT_ZERO;
    snapshot.timestamp = BIGINT_ZERO;
    snapshot.collectionCount = 0;
    snapshot.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
    snapshot.marketplaceRevenueETH = BIGDECIMAL_ZERO;
    snapshot.creatorRevenueETH = BIGDECIMAL_ZERO;
    snapshot.totalRevenueETH = BIGDECIMAL_ZERO;
    snapshot.tradeCount = 0;
    snapshot.cumulativeUniqueTraders = 0;
    snapshot.dailyTradedItemCount = 0;
    snapshot.dailyActiveTraders = 0;
    snapshot.dailyTradedCollectionCount = 0;
    snapshot.save();
  }
  return snapshot;
}

export function getNftStandard(collectionID: string): string {
  const erc165 = ERC165.bind(Address.fromString(collectionID));

  const isERC721Result = erc165.try_supportsInterface(
    Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER)
  );
  if (isERC721Result.reverted) {
    log.warning("[getNftStandard] isERC721 reverted on {}", [collectionID]);
  } else {
    if (isERC721Result.value) {
      return NFTStandards.ERC721;
    }
  }

  const isERC1155Result = erc165.try_supportsInterface(
    Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER)
  );
  if (isERC1155Result.reverted) {
    log.warning("[getNftStandard] isERC1155 reverted on {}", [collectionID]);
  } else {
    if (isERC1155Result.value) {
      return NFTStandards.ERC1155;
    }
  }

  return NFTStandards.UNKNOWN;
}

// There are two main cases in this function: 
// 1) offerer is buyer since offer has money and consideration has NFTs
// 2) offerer is seller since offer has NFTs and consideration has money
export function getTransferDetails(
  offerer: Address,
  recipient: Address,
  offer: Array<OrderFulfilledOfferStruct>,
  consideration: Array<OrderFulfilledConsiderationStruct>
): Sale | null {
  if (offer.length == 0) { // offer empty
    return null;
  }

  if (consideration.length == 0) { // consideration empty
    return null;
  }

  // Since we need to figure out who the buyer is and who the offerer is, let's
  // make a simplification and assume that you can only buy an NFT with ERC20 or NATIVE ETH
  // token, which is considered money. In reality, you can trade NFTs too, but that will make it tricky to know who the buyer and seller
  // is. If the offer contains money, then the offerer is a buyer.   
  if (offer.length == 1 && isMoney(offer[0].itemType)) { // if offer only contains money, then NFTs are in consideration
    const considerationNFTsResult = extractNFTsFromConsideration(consideration);
    if (!considerationNFTsResult) { // nft not found in consideration
      return null;
    }

    let money = new Money(offer[0].amount); 
    let fees = extractOpenSeaRoyaltyFees(recipient, consideration);
    // sale in which the offerer is buying from the recipient
    return new Sale(
      offerer,
      recipient,
      considerationNFTsResult,
      money,
      fees
    );
  
  } else { // otherwise money must be in consideration, so NFTs are in offer
    const considerationMoneyResult = extractMoneyFromConsideration(consideration);
    if (!considerationMoneyResult) { // if no money in consideration
      return null;
    }
    const offerNFTsResult = extractNFTsFromOffer(offer);
    if (!offerNFTsResult) {
      return null;
    }
    return new Sale(
      recipient,
      offerer,
      offerNFTsResult,
      considerationMoneyResult,
      extractOpenSeaRoyaltyFees(offerer, consideration)
    );
  }
}

// Sum all money amounts in consideration to get total money involved in transfer
export function extractMoneyFromConsideration(
  consideration: Array<OrderFulfilledConsiderationStruct>
): Money | null {
  let amount = BIGINT_ZERO;
  for (let i = 0; i < consideration.length; i++) {
    if (isMoney(consideration[i].itemType)) {
      amount = amount.plus(consideration[i].amount);
    }
  }
  if (amount == BIGINT_ZERO) {
    return null;
  }
  return new Money(amount);
}

// this function extracts NFTs from the offer
export function extractNFTsFromOffer(
  offer: Array<OrderFulfilledOfferStruct>
): NFTs | null {
  offer =  offer.filter((o) => isNFT(o.itemType))
  if (offer.filter((o) => isNFT(o.itemType)).length == 0) { // if none of the items in offer are NFTs
    return null;
  }

  // Assume the first item of offer is token. Sonsideration can also have same token as another item in a different amount, 
  // but we aren't handling the case where the consideration can have multiple tokens.
  const token_address = offer[0].token;
  const tokenType = offer[0].itemType;
  let tokenIds: Array<BigInt> = [];
  let amounts: Array<BigInt> = [];

  for (let i = 0; i < offer.length; i++) {
    const item = offer[i];
    if (item.token != token_address) {
      return null;
    }
    tokenIds.push(item.identifier);
    amounts.push(item.amount);
  }

  let standard = NFTStandards.UNKNOWN;
  if (isERC721(tokenType)) {
    standard = NFTStandards.ERC721;
  } else if (isERC1155(tokenType)) {
    standard = NFTStandards.ERC1155;
  }
  return new NFTs(token_address, standard, tokenIds, amounts);
}

// this function extracts the NFTs from the consideration
export function extractNFTsFromConsideration(
  consideration: Array<OrderFulfilledConsiderationStruct>
): NFTs | null {
  const nftItems = consideration.filter((c) => isNFT(c.itemType));
  if (nftItems.length == 0) {
    return null;
  }
  // Assume the first item of consideration is token. Sonsideration can also have same token as another item in a different amount, 
  // but we aren't handling the case where the consideration can have multiple tokens.
  const token_address = nftItems[0].token; 
  const tokenType = nftItems[0].itemType;
  const tokenIds: Array<BigInt> = [];
  const amounts: Array<BigInt> = [];

  for (let i = 0; i < nftItems.length; i++) {
    const item = nftItems[i];
    if (item.token != token_address) { 
      return null;
    }
    tokenIds.push(item.identifier);
    amounts.push(item.amount);
  }

  let standard = NFTStandards.UNKNOWN;
  if (isERC721(tokenType)) {
    standard = NFTStandards.ERC721;
  } if (isERC1155(tokenType)) {
    standard = NFTStandards.ERC1155;
  } 
 
  return new NFTs(token_address, standard, tokenIds, amounts);
}

export function extractOpenSeaRoyaltyFees(
  excludedRecipient: Address, // need this because royalty transfer is to the NFT creator
  consideration: Array<OrderFulfilledConsiderationStruct>
): Fees {
  const openSeaFeeItems = consideration.filter((c) => isOpenSeaFeeAccount(c.recipient));
  
  // openSea fee is 0 if we can't find it in consideration
  let openSeaFees = BIGINT_ZERO;
  if (openSeaFeeItems.length != 0) { // protocol fee not found in consideration
    openSeaFees = openSeaFeeItems[0].amount;
  }

  let royalty = BIGINT_ZERO
  for (let i = 0; i < consideration.length; i++) {
    if (!isOpenSeaFeeAccount(consideration[i].recipient) && consideration[i].recipient != excludedRecipient) {
      royalty = consideration[i].amount
      break
    }
  }

  return new Fees(openSeaFees, royalty);
}