import { Address, BigDecimal, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { describe, test, newMockEvent, clearStore, assert, beforeAll, beforeEach, afterAll, newTypedMockEvent, createMockedFunction } from "matchstick-as/assembly/index"

import { handleOrderFulfilled, getCollection, getMarketplace, getOrCreateCollectionDailySnapshot, getOrCreateMarketplaceDailySnapshot, getNftStandard, getTransferDetails, extractMoneyFromConsideration, extractNFTsFromOffer, extractNFTsFromConsideration, extractOpenSeaRoyaltyFees, Money, NFTs, Fees, Sale } from "../src/handler"
import { OrderFulfilledConsiderationStruct, OrderFulfilledOfferStruct } from "../generated/Seaport/Seaport";
import { BIGDECIMAL_MAX, BIGDECIMAL_ZERO, BIGINT_ZERO, ERC721_INTERFACE_IDENTIFIER, NFTStandards, OPENSEA_FEES_ACCOUNT, SECONDS_PER_DAY, SaleStrategies, SeaportItemType } from "../src/utils";

import { store } from "@graphprotocol/graph-ts"
import { Collection, CollectionDailySnapshot, Marketplace, MarketplaceDailySnapshot } from "../generated/schema";
import { NetworkConfigs } from "../configurations/configure";
import { ERC1155_INTERFACE_IDENTIFIER } from "../src/utils";
import { NFTMetadata } from "../generated/Seaport/NFTMetadata";

const DUMMY_ADDRESS = "0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b"
const DUMMY_ADDRESS2 = "0x388c818ca8b9251b393131c08a736a67ccb19297"

describe("getCollection()", () => {
    describe("when collection does not exist", () => {
        test("it returns ", () => {
            // Ensure the collection doesn't exist prior to fetching
            const tokenAddress = DUMMY_ADDRESS
            const collection = store.get("Collection", tokenAddress)
            assert.assertNull(collection)

            // Mock smart contract calls to control return values and execution flow
            createMockedFunction(Address.fromString(tokenAddress), "supportsInterface", "supportsInterface(bytes4):(bool)")
                .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER))])
                .returns([ethereum.Value.fromBoolean(false)])

            createMockedFunction(Address.fromString(tokenAddress), "supportsInterface", "supportsInterface(bytes4):(bool)")
                .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER))])
                .returns([ethereum.Value.fromBoolean(false)])

            createMockedFunction(Address.fromString(tokenAddress), "name", "name():(string)")
                .withArgs([])
                .returns([ethereum.Value.fromString("name")])

            createMockedFunction(Address.fromString(tokenAddress), "symbol", "symbol():(string)")
                .withArgs([])
                .returns([ethereum.Value.fromString("symbol")])

            createMockedFunction(Address.fromString(tokenAddress), "totalSupply", "totalSupply():(uint256)")
                .withArgs([])
                .returns([ethereum.Value.fromI32(10)])

            // Call function being tested, fetch collection from store directly, and ensure objects are the same by spot checking some fields
            const retVal = getCollection(tokenAddress)
            const expected = store.get("Collection", tokenAddress)
            assert.assertTrue(expected!.get("id")!.toString() == retVal.id)
            assert.assertTrue(expected!.get("name")!.toString() == retVal.name)
            assert.assertTrue(expected!.get("royaltyFee")!.toBigDecimal() == retVal.royaltyFee)
            assert.assertTrue(expected!.get("tradeCount")!.toI32() == retVal.tradeCount)
        })
    })

    describe("when collection does exist", () => {
        test("it loads existing collection", () => {
            const tokenAddress = DUMMY_ADDRESS

            // Mock smart contract calls
            createMockedFunction(Address.fromString(tokenAddress), "supportsInterface", "supportsInterface(bytes4):(bool)")
                .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER))])
                .returns([ethereum.Value.fromBoolean(false)])

            createMockedFunction(Address.fromString(tokenAddress), "supportsInterface", "supportsInterface(bytes4):(bool)")
                .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER))])
                .returns([ethereum.Value.fromBoolean(false)])

            // Create collection object and persist to store so collection is there when getCollection is called
            const existingCollection = new Collection(tokenAddress);
            existingCollection.nftStandard = getNftStandard(tokenAddress);
            existingCollection.royaltyFee = BigDecimal.fromString("1.5");
            existingCollection.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
            existingCollection.marketplaceRevenueETH = BIGDECIMAL_ZERO;
            existingCollection.creatorRevenueETH = BIGDECIMAL_ZERO;
            existingCollection.totalRevenueETH = BIGDECIMAL_ZERO;
            existingCollection.tradeCount = 1;
            existingCollection.buyerCount = 0;
            existingCollection.sellerCount = 0;
            store.set("Collection", tokenAddress, existingCollection)
            
            // Ensure collection is now there after persisting to store
            const collection = store.get("Collection", tokenAddress)
            assert.assertNotNull(collection)

            // Call method being tested and compare returned collection with pre-existing one by spot checking fields
            const retVal = getCollection(tokenAddress)
            assert.assertTrue(retVal.id == existingCollection.id)
            assert.assertTrue(retVal.royaltyFee == existingCollection.royaltyFee)
            assert.assertTrue(retVal.tradeCount == existingCollection.tradeCount)
        })
    })
})

// these test are synonymous with the getCollection tests, just with Marketplace objects
describe("getMarketplace()", () => {
    describe("When marketplace does not exist", () => {
        test("it returns new market place", () => {
            const marketplaceID = "marketplaceID"
            const marketplace = store.get("Marketplace", marketplaceID)
            assert.assertNull(marketplace)

            const retVal = getMarketplace(marketplaceID)
            const expected = store.get("Marketplace", marketplaceID)
            assert.assertTrue(expected!.get("id")!.toString() == retVal.id)
            assert.assertTrue(expected!.get("collectionCount")!.toI32() == retVal.collectionCount)
            assert.assertTrue(expected!.get("totalRevenueETH")!.toBigDecimal() == retVal.totalRevenueETH)
        })
    })

    describe("When marketplace exists", () => {
        test("it loads existing marketplace", () => {
            const marketplaceID = "marketplaceID"
            const existingMarketplace = new Marketplace(marketplaceID)
            existingMarketplace.name = NetworkConfigs.getProtocolName();
            existingMarketplace.slug = NetworkConfigs.getProtocolSlug();
            existingMarketplace.network = NetworkConfigs.getNetwork();
            existingMarketplace.schemaVersion = NetworkConfigs.getSchemaVersion();
            existingMarketplace.subgraphVersion = NetworkConfigs.getSubgraphVersion();
            existingMarketplace.methodologyVersion = NetworkConfigs.getMethodologyVersion();
            existingMarketplace.collectionCount = 1;
            existingMarketplace.tradeCount = 0;
            existingMarketplace.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
            existingMarketplace.marketplaceRevenueETH = BIGDECIMAL_ZERO;
            existingMarketplace.creatorRevenueETH = BIGDECIMAL_ZERO;
            existingMarketplace.totalRevenueETH = BigDecimal.fromString("1.2");
            existingMarketplace.cumulativeUniqueTraders = 0;
            store.set("Marketplace", marketplaceID, existingMarketplace)
            
            const marketplace = store.get("Marketplace", marketplaceID)
            assert.assertNotNull(marketplace)

            const retVal = getMarketplace(marketplaceID)
            assert.assertTrue(retVal.id == existingMarketplace.id)
            assert.assertTrue(retVal.collectionCount == existingMarketplace.collectionCount)
            assert.assertTrue(retVal.totalRevenueETH == existingMarketplace.totalRevenueETH)
        })
    })
})

// these test are synonymous with the getCollection tests, just with MarketplaceDailySnapshot objects
describe("getOrCreateMarketplaceDailySnapshot()", () => {
    describe("When market daily snapshot does not exist", () => {
        test("it returns new market daily snapshot place", () => {
            const timestamp = BigInt.fromU32(1)
            const snapshotID = (timestamp.toI32() / SECONDS_PER_DAY).toString();
            const snapshot = store.get("MarketplaceDailySnapshot", snapshotID)
            assert.assertNull(snapshot)

            const retVal = getOrCreateMarketplaceDailySnapshot(timestamp)
            const expected = store.get("MarketplaceDailySnapshot", snapshotID)
            assert.assertTrue(expected!.get("id")!.toString() == retVal.id)
            assert.assertTrue(expected!.get("collectionCount")!.toI32() == retVal.collectionCount)
            assert.assertTrue(expected!.get("blockNumber")!.toBigInt() == retVal.blockNumber)
            assert.assertTrue(expected!.get("tradeCount")!.toI32() == retVal.tradeCount)
        })
    })

    describe("When market daily snapshot exists", () => {
        test("it loads market daily snapshot marketplace", () => {
            const timestamp = BigInt.fromU32(1)
            const snapshotID = (timestamp.toI32() / SECONDS_PER_DAY).toString();
            const existingSnapshot = new MarketplaceDailySnapshot(snapshotID)
            existingSnapshot.marketplace = NetworkConfigs.getMarketplaceAddress();
            existingSnapshot.blockNumber = BIGINT_ZERO;
            existingSnapshot.timestamp = BIGINT_ZERO;
            existingSnapshot.collectionCount = 0;
            existingSnapshot.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
            existingSnapshot.marketplaceRevenueETH = BIGDECIMAL_ZERO;
            existingSnapshot.creatorRevenueETH = BIGDECIMAL_ZERO;
            existingSnapshot.totalRevenueETH = BIGDECIMAL_ZERO;
            existingSnapshot.tradeCount = 0;
            existingSnapshot.cumulativeUniqueTraders = 0;
            existingSnapshot.dailyTradedItemCount = 0;
            existingSnapshot.dailyActiveTraders = 0;
            existingSnapshot.dailyTradedCollectionCount = 0;
            store.set("MarketplaceDailySnapshot", snapshotID, existingSnapshot)
            
            const snapshot = store.get("MarketplaceDailySnapshot", snapshotID)
            assert.assertNotNull(snapshot)

            const retVal = getOrCreateMarketplaceDailySnapshot(timestamp)
            assert.assertTrue(retVal.id == existingSnapshot.id)
            assert.assertTrue(retVal.collectionCount == existingSnapshot.collectionCount)
            assert.assertTrue(retVal.blockNumber == existingSnapshot.blockNumber)
            assert.assertTrue(retVal.tradeCount == existingSnapshot.tradeCount)
        })
    })
})

// these test are synonymous with the getCollection tests, just with CollectionDailySnapshot objects
describe("getOrCreateCollectionDailySnapshot()", () => {
    describe("When collection daily snapshot does not exist", () => {
        test("it returns new collection daily snapshot place", () => {
            const collection = "collection"
            const timestamp = BigInt.fromU32(1)
            const snapshotID = collection.concat("-").concat((timestamp.toI32() / SECONDS_PER_DAY).toString());
            const snapshot = store.get("CollectionDailySnapshot", snapshotID)
            assert.assertNull(snapshot)

            const retVal = getOrCreateCollectionDailySnapshot(collection, timestamp)
            const expected = store.get("CollectionDailySnapshot", snapshotID)
            assert.assertTrue(expected!.get("id")!.toString() == retVal.id)
            assert.assertTrue(expected!.get("collection")!.toString() == retVal.collection)
            assert.assertTrue(expected!.get("blockNumber")!.toBigInt() == retVal.blockNumber)
            assert.assertTrue(expected!.get("tradeCount")!.toI32() == retVal.tradeCount)
        })
    })

    describe("When collection daily snapshot exists", () => {
        test("it loads collection daily snapshot marketplace", () => {
            const collection = "collection"
            const timestamp = BigInt.fromU32(1)
            const snapshotID = collection.concat("-").concat((timestamp.toI32() / SECONDS_PER_DAY).toString());
            const existingSnapshot = new CollectionDailySnapshot(snapshotID)
            existingSnapshot.collection = collection;
            existingSnapshot.blockNumber = BIGINT_ZERO;
            existingSnapshot.timestamp = BIGINT_ZERO;
            existingSnapshot.royaltyFee = BIGDECIMAL_ZERO;
            existingSnapshot.dailyMinSalePrice = BIGDECIMAL_MAX;
            existingSnapshot.dailyMaxSalePrice = BIGDECIMAL_ZERO;
            existingSnapshot.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
            existingSnapshot.dailyTradeVolumeETH = BIGDECIMAL_ZERO;
            existingSnapshot.marketplaceRevenueETH = BIGDECIMAL_ZERO;
            existingSnapshot.creatorRevenueETH = BIGDECIMAL_ZERO;
            existingSnapshot.totalRevenueETH = BIGDECIMAL_ZERO;
            existingSnapshot.tradeCount = 0;
            existingSnapshot.dailyTradedItemCount = 0;
            store.set("CollectionDailySnapshot", snapshotID, existingSnapshot)
            
            const snapshot = store.get("CollectionDailySnapshot", snapshotID)
            assert.assertNotNull(snapshot)

            const retVal = getOrCreateCollectionDailySnapshot(collection, timestamp)
            assert.assertTrue(retVal.id == existingSnapshot.id)
            assert.assertTrue(retVal.collection == existingSnapshot.collection)
            assert.assertTrue(retVal.blockNumber == existingSnapshot.blockNumber)
            assert.assertTrue(retVal.tradeCount == existingSnapshot.tradeCount)
        })
    })
})

describe("getNftStandard()", () => {
    describe("when ERC721 and ERC1155 do not support the collection interface ", () => {
        test("it returns NFTStandards.UNKNOWN", () => {
            const collectionID = DUMMY_ADDRESS

            // Mock smart contract calls
            createMockedFunction(Address.fromString(collectionID), "supportsInterface", "supportsInterface(bytes4):(bool)")
                .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER))])
                .returns([ethereum.Value.fromBoolean(false)])

            createMockedFunction(Address.fromString(collectionID), "supportsInterface", "supportsInterface(bytes4):(bool)")
                .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER))])
                .returns([ethereum.Value.fromBoolean(false)])

            const retVal = getNftStandard(collectionID)
            assert.assertTrue(retVal == NFTStandards.UNKNOWN)
        })
    })

    describe("when ERC721 does support the collection interface and ERC1155 does not ", () => {
        test("it returns NFTStandards.ERC721", () => {
            const collectionID = DUMMY_ADDRESS

            // Mock smart contract calls
            createMockedFunction(Address.fromString(collectionID), "supportsInterface", "supportsInterface(bytes4):(bool)")
                .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER))])
                .returns([ethereum.Value.fromBoolean(true)])

            createMockedFunction(Address.fromString(collectionID), "supportsInterface", "supportsInterface(bytes4):(bool)")
                .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER))])
                .returns([ethereum.Value.fromBoolean(false)])
            
            const retVal = getNftStandard(collectionID)
            assert.assertTrue(retVal == NFTStandards.ERC721)
        })
    })

    describe("when ERC1155 does support the collection interface and ERC721 does not ", () => {
        test("it returns NFTStandards.ERC1155", () => {
            const collectionID = DUMMY_ADDRESS

            // Mock smart contract calls
            createMockedFunction(Address.fromString(collectionID), "supportsInterface", "supportsInterface(bytes4):(bool)")
                .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER))])
                .returns([ethereum.Value.fromBoolean(false)])

            createMockedFunction(Address.fromString(collectionID), "supportsInterface", "supportsInterface(bytes4):(bool)")
                .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER))])
                .returns([ethereum.Value.fromBoolean(true)])
            
            const retVal = getNftStandard(collectionID)
            assert.assertTrue(retVal == NFTStandards.ERC1155)
        })
    })
})

describe("getTransferDetails()", () => {
    describe("when offer is empty", () => {
        test("it returns null", () => {
            const offerer = Address.fromString(DUMMY_ADDRESS)
            const recipient = Address.fromString(DUMMY_ADDRESS2)

            // Create empty offer
            const offer: OrderFulfilledOfferStruct[] = []

            // Create non-empty consideration
            const considerationTupleArray = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
            ]
            const considerationItem = changetype<OrderFulfilledConsiderationStruct>(considerationTupleArray)
            const consideration = [
                considerationItem
            ]

            const retVal = getTransferDetails(offerer, recipient, offer, consideration)
            assert.assertNull(retVal)
        })
    })

    describe("when consideration is empty", () => {
        test("it returns null", () => {
            const offerer = Address.fromString(DUMMY_ADDRESS)
            const recipient = Address.fromString(DUMMY_ADDRESS2)
            
            // Create non-empty offer
            const offerTupleArray = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
            ]
            const offerItem = changetype<OrderFulfilledOfferStruct>(offerTupleArray)
            const offer = [
                offerItem
            ]

            // Create empty consideration
            const consideration: OrderFulfilledConsiderationStruct[] = []

            const retVal = getTransferDetails(offerer, recipient, offer, consideration)
            assert.assertNull(retVal)
        })
    })

    describe("when offer and consideration are present, offer is money, and consideration is not NFT", () => {
        test("it returns null", () => {
            const offerer = Address.fromString(DUMMY_ADDRESS)
            const recipient = Address.fromString(DUMMY_ADDRESS2)
            
            // Create non-empty offer that consists of money and not NFTs
            const offerTupleArray = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
            ]
            const offerItem = changetype<OrderFulfilledOfferStruct>(offerTupleArray)
            const offer = [
                offerItem
            ]

            // Create non-empty consideration that consists of money and not NFTs
            const considerationTupleArray = [
                ethereum.Value.fromI32(SeaportItemType.ERC20),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
            ]
            const considerationItem = changetype<OrderFulfilledConsiderationStruct>(considerationTupleArray)
            const consideration = [
                considerationItem
            ]

            const retVal = getTransferDetails(offerer, recipient, offer, consideration)
            assert.assertNull(retVal)
        })
    })

    describe("when offer and consideration are present, offer is money, and consideration is NFT", () => {
        test("it returns a sale with offerer as buyer and recipient as seller", () => {
            const offerer = Address.fromString(DUMMY_ADDRESS)
            const recipient = Address.fromString(DUMMY_ADDRESS2)
            
            // Create non-empty offer that consists of money and not NFTs
            const offerTupleArray = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
            ]
            const offerItem = changetype<OrderFulfilledOfferStruct>(offerTupleArray)
            const offer = [
                offerItem
            ]

            // Create non-empty consideration that consists of NFTs and not money
            const considerationTupleArray = [
                ethereum.Value.fromI32(SeaportItemType.ERC721),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
            ]
            const considerationItem = changetype<OrderFulfilledConsiderationStruct>(considerationTupleArray)
            const consideration = [
                considerationItem
            ]

            const retVal = getTransferDetails(offerer, recipient, offer, consideration)
            assert.assertTrue(retVal!.buyer == offerer)
            assert.assertTrue(retVal!.seller == recipient)
            assert.assertTrue(retVal!.money.amount == BigInt.fromU32(10))
        })
    })

    describe("when offer and consideration are present, offer is non-money, and consideration is non-money", () => {
        test("it returns null", () => {
            const offerer = Address.fromString(DUMMY_ADDRESS)
            const recipient = Address.fromString(DUMMY_ADDRESS2)
            
            // Create non-empty offer that consists of NFTs
            const offerTupleArray = [
                ethereum.Value.fromI32(SeaportItemType.ERC1155),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
            ]
            const offerItem = changetype<OrderFulfilledOfferStruct>(offerTupleArray)
            const offer = [
                offerItem
            ]

            // Create non-empty consideration that consists of NFTs
            const considerationTupleArray = [
                ethereum.Value.fromI32(SeaportItemType.ERC721),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
            ]
            const considerationItem = changetype<OrderFulfilledConsiderationStruct>(considerationTupleArray)
            const consideration = [
                considerationItem
            ]

            const retVal = getTransferDetails(offerer, recipient, offer, consideration)
            assert.assertNull(retVal)
        })
    })

    describe("when offer and consideration are present, offer is non-NFTs, and consideration is money", () => {
        test("it returns null", () => {
            const offerer = Address.fromString(DUMMY_ADDRESS)
            const recipient = Address.fromString(DUMMY_ADDRESS2)
            
            // Create non-empty offer that consists of money
            const offerTupleArray = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
            ]
            const offerItem = changetype<OrderFulfilledOfferStruct>(offerTupleArray)
            const offer = [
                offerItem
            ]

            // Create non-empty consideration that consists of money
            const considerationTupleArray = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
            ]
            const considerationItem = changetype<OrderFulfilledConsiderationStruct>(considerationTupleArray)
            const consideration = [
                considerationItem
            ]

            const retVal = getTransferDetails(offerer, recipient, offer, consideration)
            assert.assertNull(retVal)
        })
    })

    describe("when offer and consideration are present, offer is NFTs, and consideration is money", () => {
        test("it returns a sale with offerer as seller and recipient as buyer", () => {
            const offerer = Address.fromString(DUMMY_ADDRESS)
            const recipient = Address.fromString(DUMMY_ADDRESS2)
            
            // Create non-empty offer that consists of NFTs
            const offerTupleArray = [
                ethereum.Value.fromI32(SeaportItemType.ERC721),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
            ]
            const offerItem = changetype<OrderFulfilledOfferStruct>(offerTupleArray)
            const offer = [
                offerItem
            ]

            // Create non-empty consideration that consists of moeny
            const considerationTupleArray = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(20)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
            ]
            const considerationItem = changetype<OrderFulfilledConsiderationStruct>(considerationTupleArray)
            const consideration = [
                considerationItem
            ]

            const retVal = getTransferDetails(offerer, recipient, offer, consideration)
            assert.assertTrue(retVal!.buyer == recipient)
            assert.assertTrue(retVal!.seller == offerer)
            assert.assertTrue(retVal!.money.amount == BigInt.fromU32(20))
        })
    })
})

describe("extractMoneyFromConsideration()", () => {
    describe("when all money in consideration sums to zero", () => {
        test("it returns null", () => {
            // Create consideration
            const tupleArray = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const considerationItem = changetype<OrderFulfilledConsiderationStruct>(tupleArray)
            const consideration = [
                considerationItem
            ]

            const retVal = extractMoneyFromConsideration(consideration)
            assert.assertNull(retVal)
        })
    })

    describe("when all money in consideration sums to non-zero", () => {
        test("it returns correct money amount", () => {
            // Create consideration
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.ERC20),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(90)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const considerationItem1 = changetype<OrderFulfilledConsiderationStruct>(tupleArray1)
            const considerationItem2 = changetype<OrderFulfilledConsiderationStruct>(tupleArray2)
            const consideration = [
                considerationItem1,
                considerationItem2
            ]

            const retVal = extractMoneyFromConsideration(consideration)
            assert.bigIntEquals(retVal!.amount!, BigInt.fromU32(100))
        })
    })

    describe("when consideration is all non-money", () => {
        test("it returns null", () => {
            // Create consideration
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.ERC1155),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const considerationItem1 = changetype<OrderFulfilledConsiderationStruct>(tupleArray1)
            const consideration = [
                considerationItem1,
            ]

            const retVal = extractMoneyFromConsideration(consideration)
            assert.assertNull(retVal)
        })
    })

    describe("when consideration is partially money and partially non-money and sums to zero", () => {
        test("it returns null", () => {
            // Create consideration
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.ERC721_WITH_CRITERIA),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(90)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const considerationItem1 = changetype<OrderFulfilledConsiderationStruct>(tupleArray1)
            const considerationItem2 = changetype<OrderFulfilledConsiderationStruct>(tupleArray2)
            const consideration = [
                considerationItem1,
                considerationItem2
            ]

            const retVal = extractMoneyFromConsideration(consideration)
            assert.assertNull(retVal)
        })
    })

    describe("when consideration is partially money and partially non-money and sums to non-zero", () => {
        test("it returns sum of money consideration items only", () => {
            // Create consideration
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.ERC721_WITH_CRITERIA),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(90)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const considerationItem1 = changetype<OrderFulfilledConsiderationStruct>(tupleArray1)
            const considerationItem2 = changetype<OrderFulfilledConsiderationStruct>(tupleArray2)
            const consideration = [
                considerationItem1,
                considerationItem2
            ]

            const retVal = extractMoneyFromConsideration(consideration)
            assert.bigIntEquals(retVal!.amount!, BigInt.fromU32(10))
        })
    })
})

describe("extractNFTsFromOffer()", () => {
    describe("when all offer items are non-NFTs", () => {
        test("it returns null", () => {
            // Create offer
            const tupleArray = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
            ]
            const offerItem = changetype<OrderFulfilledOfferStruct>(tupleArray)
            const offer = [
                offerItem
            ]

            const retVal = extractNFTsFromOffer(offer)
            assert.assertNull(retVal)
        })
    })

    describe("when offer contains multiple NFTs and are different tokens", () => {
        test("it returns null", () => {
            // Create offer
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.ERC721),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.ERC721),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
            ]
            const offerItem1 = changetype<OrderFulfilledOfferStruct>(tupleArray1)
            const offerItem2 = changetype<OrderFulfilledOfferStruct>(tupleArray2)
            const offer = [
                offerItem1,
                offerItem2
            ]

            const retVal = extractNFTsFromOffer(offer)
            assert.assertNull(retVal)
        })
    })

    describe("when offer contains multiple NFTs and are same tokens that are ERC721", () => {
        test("it returns an ERC721 NFTs collection", () => {
            // Create offer
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.ERC721),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.ERC721),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
            ]
            const offerItem1 = changetype<OrderFulfilledOfferStruct>(tupleArray1)
            const offerItem2 = changetype<OrderFulfilledOfferStruct>(tupleArray2)
            const offer = [
                offerItem1,
                offerItem2
            ]

            const retVal = extractNFTsFromOffer(offer)
            const expected = new NFTs(Address.fromString(DUMMY_ADDRESS), NFTStandards.ERC721, [BigInt.fromU32(1), BigInt.fromU32(1)], [BigInt.fromU32(10), BigInt.fromU32(10)])

            assert.assertTrue(retVal!.tokenAddress == expected.tokenAddress)
            assert.assertTrue(retVal!.standard == expected.standard)
            
            assert.assertTrue(retVal!.tokenIds.length == 2)
            assert.assertTrue(retVal!.tokenIds[0] == BigInt.fromU32(1))
            assert.assertTrue(retVal!.tokenIds[1] == BigInt.fromU32(1))
            
            assert.assertTrue(retVal!.amounts.length == 2)
            assert.assertTrue(retVal!.amounts[0] == BigInt.fromU32(10))
            assert.assertTrue(retVal!.amounts[1] == BigInt.fromU32(10))
        })
    })

    describe("when offer contains multiple NFTs and are same tokens that are ERC1155", () => {
        test("it returns an ERC1155 NFTs collection", () => {
            // Create offer
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.ERC1155),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.ERC1155),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
            ]
            const offerItem1 = changetype<OrderFulfilledOfferStruct>(tupleArray1)
            const offerItem2 = changetype<OrderFulfilledOfferStruct>(tupleArray2)
            const offer = [
                offerItem1,
                offerItem2
            ]

            const retVal = extractNFTsFromOffer(offer)
            const expected = new NFTs(Address.fromString(DUMMY_ADDRESS), NFTStandards.ERC1155, [BigInt.fromU32(1), BigInt.fromU32(1)], [BigInt.fromU32(10), BigInt.fromU32(10)])

            assert.assertTrue(retVal!.tokenAddress == expected.tokenAddress)
            assert.assertTrue(retVal!.standard == expected.standard)
            
            assert.assertTrue(retVal!.tokenIds.length == 2)
            assert.assertTrue(retVal!.tokenIds[0] == BigInt.fromU32(1))
            assert.assertTrue(retVal!.tokenIds[1] == BigInt.fromU32(1))
            
            assert.assertTrue(retVal!.amounts.length == 2)
            assert.assertTrue(retVal!.amounts[0] == BigInt.fromU32(10))
            assert.assertTrue(retVal!.amounts[1] == BigInt.fromU32(10))
        })
    })
})

describe("extractNFTsFromConsideration()", () => {
    describe("when all consideration items are non-NFTs", () => {
        test("it returns null", () => {
            // Create consideration
            const tupleArray = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const considerationItem = changetype<OrderFulfilledConsiderationStruct>(tupleArray)
            const consideration = [
                considerationItem
            ]

            const retVal = extractNFTsFromConsideration(consideration)
            assert.assertNull(retVal)
        })
    })

    describe("when consideration contains multiple NFTs and are different tokens", () => {
        test("it returns null", () => {
            // Create consideration
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.ERC721),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.ERC721),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS2)),
            ]
            const considerationItem1 = changetype<OrderFulfilledConsiderationStruct>(tupleArray1)
            const considerationItem2 = changetype<OrderFulfilledConsiderationStruct>(tupleArray2)
            const consideration = [
                considerationItem1,
                considerationItem2
            ]

            const retVal = extractNFTsFromConsideration(consideration)
            assert.assertNull(retVal)
        })
    })

    describe("when consideration contains multiple NFTs and are same tokens that are ERC721", () => {
        test("it returns an ERC721 NFTs collection", () => {
            // Create consideration
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.ERC721),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.ERC721),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const considerationItem1 = changetype<OrderFulfilledConsiderationStruct>(tupleArray1)
            const considerationItem2 = changetype<OrderFulfilledConsiderationStruct>(tupleArray2)
            const consideration = [
                considerationItem1,
                considerationItem2
            ]

            const retVal = extractNFTsFromConsideration(consideration)
            const expected = new NFTs(Address.fromString(DUMMY_ADDRESS), NFTStandards.ERC721, [BigInt.fromU32(1), BigInt.fromU32(1)], [BigInt.fromU32(10), BigInt.fromU32(10)])

            assert.assertTrue(retVal!.tokenAddress == expected.tokenAddress)
            assert.assertTrue(retVal!.standard == expected.standard)
            
            assert.assertTrue(retVal!.tokenIds.length == 2)
            assert.assertTrue(retVal!.tokenIds[0] == BigInt.fromU32(1))
            assert.assertTrue(retVal!.tokenIds[1] == BigInt.fromU32(1))
            
            assert.assertTrue(retVal!.amounts.length == 2)
            assert.assertTrue(retVal!.amounts[0] == BigInt.fromU32(10))
            assert.assertTrue(retVal!.amounts[1] == BigInt.fromU32(10))
        })
    })

    describe("when consideration contains multiple NFTs and are same tokens that are ERC1155", () => {
        test("it returns an ERC1155 NFTs collection", () => {
            // Create consideration
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.ERC1155),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.ERC1155),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
            ]
            const considerationItem1 = changetype<OrderFulfilledConsiderationStruct>(tupleArray1)
            const considerationItem2 = changetype<OrderFulfilledConsiderationStruct>(tupleArray2)
            const consideration = [
                considerationItem1,
                considerationItem2
            ]

            const retVal = extractNFTsFromConsideration(consideration)
            const expected = new NFTs(Address.fromString(DUMMY_ADDRESS), NFTStandards.ERC1155, [BigInt.fromU32(1), BigInt.fromU32(1)], [BigInt.fromU32(10), BigInt.fromU32(10)])

            assert.assertTrue(retVal!.tokenAddress == expected.tokenAddress)
            assert.assertTrue(retVal!.standard == expected.standard)
            
            assert.assertTrue(retVal!.tokenIds.length == 2)
            assert.assertTrue(retVal!.tokenIds[0] == BigInt.fromU32(1))
            assert.assertTrue(retVal!.tokenIds[1] == BigInt.fromU32(1))
            
            assert.assertTrue(retVal!.amounts.length == 2)
            assert.assertTrue(retVal!.amounts[0] == BigInt.fromU32(10))
            assert.assertTrue(retVal!.amounts[1] == BigInt.fromU32(10))
        })
    })
})

describe("extractOpenSeaRoyaltyFees()", () => {
    describe("when consideration does not have open sea fee account recipient and has only excluded recipient items", () => {
        test("it returns zero fees", () => {
            // Create consideration
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const considerationItem1 = changetype<OrderFulfilledConsiderationStruct>(tupleArray1)
            const considerationItem2 = changetype<OrderFulfilledConsiderationStruct>(tupleArray2)
            const consideration = [
                considerationItem1,
                considerationItem2
            ]

            const retVal = extractOpenSeaRoyaltyFees(Address.fromString(DUMMY_ADDRESS), consideration)
            assert.assertTrue(retVal.protocolRevenue == BIGINT_ZERO)
            assert.assertTrue(retVal.creatorRevenue == BIGINT_ZERO)
        })
    })

    describe("when consideration does have open sea fee account recipient and has only excluded recipient items", () => {
        test("it returns non-zero protocol fees and zero royalty fees", () => {
            // Create consideration
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
                ethereum.Value.fromAddress(OPENSEA_FEES_ACCOUNT),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const considerationItem1 = changetype<OrderFulfilledConsiderationStruct>(tupleArray1)
            const considerationItem2 = changetype<OrderFulfilledConsiderationStruct>(tupleArray2)
            const consideration = [
                considerationItem1,
                considerationItem2
            ]

            const retVal = extractOpenSeaRoyaltyFees(Address.fromString(DUMMY_ADDRESS), consideration)
            assert.assertTrue(retVal.protocolRevenue == BigInt.fromU32(10))
            assert.assertTrue(retVal.creatorRevenue == BIGINT_ZERO)
        })
    })

    describe("when consideration does not have open sea fee account recipient and has non-excluded recipient items", () => {
        test("it returns zero protocol fees and non-zero royalty fees", () => {
            // Create consideration
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(0)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const considerationItem1 = changetype<OrderFulfilledConsiderationStruct>(tupleArray1)
            const considerationItem2 = changetype<OrderFulfilledConsiderationStruct>(tupleArray2)
            const consideration = [
                considerationItem1,
                considerationItem2
            ]

            const retVal = extractOpenSeaRoyaltyFees(Address.fromString(DUMMY_ADDRESS2), consideration)
            assert.assertTrue(retVal.protocolRevenue == BIGINT_ZERO)
            assert.assertTrue(retVal.creatorRevenue == BigInt.fromU32(10))
        })
    })

    describe("when consideration does have open sea fee account recipient and has non-excluded recipient items", () => {
        test("it returns non-zero protocol fees and non-zero royalty fees", () => {
            // Create consideration
            const tupleArray1 = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(10)),
                ethereum.Value.fromAddress(OPENSEA_FEES_ACCOUNT),
            ]
            const tupleArray2 = [
                ethereum.Value.fromI32(SeaportItemType.NATIVE),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(1)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromU32(50)),
                ethereum.Value.fromAddress(Address.fromString(DUMMY_ADDRESS)),
            ]
            const considerationItem1 = changetype<OrderFulfilledConsiderationStruct>(tupleArray1)
            const considerationItem2 = changetype<OrderFulfilledConsiderationStruct>(tupleArray2)
            const consideration = [
                considerationItem1,
                considerationItem2
            ]

            const retVal = extractOpenSeaRoyaltyFees(Address.fromString(DUMMY_ADDRESS2), consideration)
            assert.assertTrue(retVal.protocolRevenue == BigInt.fromU32(10))
            assert.assertTrue(retVal.creatorRevenue == BigInt.fromU32(50))
        })
    })
})