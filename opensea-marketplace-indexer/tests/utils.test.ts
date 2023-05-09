import { Address, BigDecimal, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { describe, test, newMockEvent, clearStore, assert, beforeAll, beforeEach, afterAll, newTypedMockEvent, createMockedFunction } from "matchstick-as/assembly/index"
import { min, max, isMoney, isNFT, isERC721, isERC1155, isOpenSeaFeeAccount, orderFulfillmentMethod, tradeStrategy, SeaportItemType, OPENSEA_ETHEREUM_FEE_COLLECTOR, OPENSEA_FEES_ACCOUNT, MethodSignatures, OrderFulfillmentMethods, SaleStrategies} from "../src/utils"

const DUMMY_ADDRESS = "0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b"

describe("min()", () => {
    describe("When a is less than b", () => {
        test("it returns a", () => {
            const a = new BigDecimal(BigInt.fromU32(1))
            const b = new BigDecimal(BigInt.fromU32(2))
            const retVal = min(a, b)
            assert.assertTrue(retVal.equals(a))
        })
    })

    describe("When a is equal to b", () => {
        test("it returns a or b", () => {
            const a = new BigDecimal(BigInt.fromU32(1))
            const b = new BigDecimal(BigInt.fromU32(1))
            const retVal = min(a, b)
            assert.assertTrue(retVal.equals(a))
            assert.assertTrue(retVal.equals(b))
        })
    })

    describe("When a is greater than b", () => {
        test("it return b", () => {
            const a = new BigDecimal(BigInt.fromU32(3))
            const b = new BigDecimal(BigInt.fromU32(2))
            const retVal = min(a, b)
            assert.assertTrue(retVal.equals(b))
        })
    })
})

describe("max()", () => {
    describe("When a is less than b", () => {
        test("it returns a", () => {
            const a = new BigDecimal(BigInt.fromU32(1))
            const b = new BigDecimal(BigInt.fromU32(2))
            const retVal = max(a, b)
            assert.assertTrue(retVal.equals(b))
        })
    })

    describe("When a is equal to b", () => {
        test("it returns a or b", () => {
            const a = new BigDecimal(BigInt.fromU32(1))
            const b = new BigDecimal(BigInt.fromU32(1))
            const retVal = max(a, b)
            assert.assertTrue(retVal.equals(a))
            assert.assertTrue(retVal.equals(b))
        })
    })

    describe("When a is greater than b", () => {
        test("it return b", () => {
            const a = new BigDecimal(BigInt.fromU32(3))
            const b = new BigDecimal(BigInt.fromU32(2))
            const retVal = max(a, b)
            assert.assertTrue(retVal.equals(a))
        })
    })
})

describe("isMoney()", () => {
    describe("itemType is NATIVE", () => {
        test("it returns true", () => {
            const itemType = SeaportItemType.NATIVE
            const retVal = isMoney(itemType)
            assert.assertTrue(retVal)
        })
    })

    describe("itemType is ERC20", () => {
        test("it returns true", () => {
            const itemType = SeaportItemType.ERC20
            const retVal = isMoney(itemType)
            assert.assertTrue(retVal)
        })
    })

    describe("itemType is ERC721", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.ERC721
            const retVal = isMoney(itemType)
            assert.assertTrue(!retVal)
        })
    })

    describe("itemType is ERC1155", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.ERC1155
            const retVal = isMoney(itemType)
            assert.assertTrue(!retVal)
        })
    })

    describe("itemType is ERC721_WITH_CRITERIA", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.ERC721_WITH_CRITERIA
            const retVal = isMoney(itemType)
            assert.assertTrue(!retVal)
        })
    })

    describe("itemType is ERC1155_WITH_CRITERIA", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.ERC1155_WITH_CRITERIA
            const retVal = isMoney(itemType)
            assert.assertTrue(!retVal)
        })
    })
})

describe("isNFT()", () => {
    describe("itemType is NATIVE", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.NATIVE
            const retVal = isNFT(itemType)
            assert.assertTrue(!retVal)
        })
    })

    describe("itemType is ERC20", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.ERC20
            const retVal = isNFT(itemType)
            assert.assertTrue(!retVal)
        })
    })

    describe("itemType is ERC721", () => {
        test("it returns true", () => {
            const itemType = SeaportItemType.ERC721
            const retVal = isNFT(itemType)
            assert.assertTrue(retVal)
        })
    })

    describe("itemType is ERC1155", () => {
        test("it returns true", () => {
            const itemType = SeaportItemType.ERC1155
            const retVal = isNFT(itemType)
            assert.assertTrue(retVal)
        })
    })

    describe("itemType is ERC721_WITH_CRITERIA", () => {
        test("it returns true", () => {
            const itemType = SeaportItemType.ERC721_WITH_CRITERIA
            const retVal = isNFT(itemType)
            assert.assertTrue(retVal)
        })
    })

    describe("itemType is ERC1155_WITH_CRITERIA", () => {
        test("it returns true", () => {
            const itemType = SeaportItemType.ERC1155_WITH_CRITERIA
            const retVal = isNFT(itemType)
            assert.assertTrue(retVal)
        })
    })
})

describe("isERC721()", () => {
    describe("itemType is NATIVE", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.NATIVE
            const retVal = isERC721(itemType)
            assert.assertTrue(!retVal)
        })
    })

    describe("itemType is ERC20", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.ERC20
            const retVal = isERC721(itemType)
            assert.assertTrue(!retVal)
        })
    })

    describe("itemType is ERC721", () => {
        test("it returns true", () => {
            const itemType = SeaportItemType.ERC721
            const retVal = isERC721(itemType)
            assert.assertTrue(retVal)
        })
    })

    describe("itemType is ERC1155", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.ERC1155
            const retVal = isERC721(itemType)
            assert.assertTrue(!retVal)
        })
    })

    describe("itemType is ERC721_WITH_CRITERIA", () => {
        test("it returns true", () => {
            const itemType = SeaportItemType.ERC721_WITH_CRITERIA
            const retVal = isERC721(itemType)
            assert.assertTrue(retVal)
        })
    })

    describe("itemType is ERC1155_WITH_CRITERIA", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.ERC1155_WITH_CRITERIA
            const retVal = isERC721(itemType)
            assert.assertTrue(!retVal)
        })
    })
})

describe("isERC1155()", () => {
    describe("itemType is NATIVE", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.NATIVE
            const retVal = isERC1155(itemType)
            assert.assertTrue(!retVal)
        })
    })

    describe("itemType is ERC20", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.ERC20
            const retVal = isERC1155(itemType)
            assert.assertTrue(!retVal)
        })
    })

    describe("itemType is ERC721", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.ERC721
            const retVal = isERC1155(itemType)
            assert.assertTrue(!retVal)
        })
    })

    describe("itemType is ERC1155", () => {
        test("it returns true", () => {
            const itemType = SeaportItemType.ERC1155
            const retVal = isERC1155(itemType)
            assert.assertTrue(retVal)
        })
    })

    describe("itemType is ERC721_WITH_CRITERIA", () => {
        test("it returns false", () => {
            const itemType = SeaportItemType.ERC721_WITH_CRITERIA
            const retVal = isERC1155(itemType)
            assert.assertTrue(!retVal)
        })
    })

    describe("itemType is ERC1155_WITH_CRITERIA", () => {
        test("it returns true", () => {
            const itemType = SeaportItemType.ERC1155_WITH_CRITERIA
            const retVal = isERC1155(itemType)
            assert.assertTrue(retVal)
        })
    })
})

describe("isOpenSeaFeeAccount()", () => {
    describe("address is OPENSEA_FEES_ACCOUNT", () => {
        test("it returns true", () => {
            const retVal = isOpenSeaFeeAccount(OPENSEA_FEES_ACCOUNT)
            assert.assertTrue(retVal)
        })
    })

    describe("address is OPENSEA_ETHEREUM_FEE_COLLECTOR", () => {
        test("it returns true", () => {
            const retVal = isOpenSeaFeeAccount(OPENSEA_ETHEREUM_FEE_COLLECTOR)
            assert.assertTrue(retVal)
        })
    })

    describe("address is not OPENSEA_FEES_ACCOUNT or OPENSEA_ETHEREUM_FEE_COLLECTOR", () => {
        test("it returns false", () => {
            const retVal = isOpenSeaFeeAccount(Address.fromString(DUMMY_ADDRESS))
            assert.assertTrue(!retVal)
        })
    })
})

describe("orderFulfillmentMethod()", () => {
    describe("methodSignature is FULFILL_BASIC_ORDER", () => {
        test("it returns FULFILL_BASIC_ORDER fulfillment method", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.FULFILL_BASIC_ORDER.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = orderFulfillmentMethod(event)
            assert.stringEquals(retVal!, OrderFulfillmentMethods.FULFILL_BASIC_ORDER)
        })
    })

    describe("methodSignature is FULFILL_ORDER", () => {
        test("it returns FULFILL_ORDER fulfillment method", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.FULFILL_ORDER.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = orderFulfillmentMethod(event)
            assert.stringEquals(retVal!, OrderFulfillmentMethods.FULFILL_ORDER)
        })
    })

    describe("methodSignature is FULFILL_ADVANCED_ORDER", () => {
        test("it returns FULFILL_ADVANCED_ORDER fulfillment method", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.FULFILL_ADVANCED_ORDER.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = orderFulfillmentMethod(event)
            assert.stringEquals(retVal!, OrderFulfillmentMethods.FULFILL_ADVANCED_ORDER)
        })
    })

    describe("methodSignature is FULFILL_AVAILABLE_ORDERS", () => {
        test("it returns FULFILL_AVAILABLE_ORDERS fulfillment method", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.FULFILL_AVAILABLE_ORDERS.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = orderFulfillmentMethod(event)
            assert.stringEquals(retVal!, OrderFulfillmentMethods.FULFILL_AVAILABLE_ORDERS)
        })
    })

    describe("methodSignature is FULFILL_AVAILABLE_ADVANCED_ORDERS", () => {
        test("it returns FULFILL_AVAILABLE_ADVANCED_ORDERS fulfillment method", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.FULFILL_AVAILABLE_ADVANCED_ORDERS.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = orderFulfillmentMethod(event)
            assert.stringEquals(retVal!, OrderFulfillmentMethods.FULFILL_AVAILABLE_ADVANCED_ORDERS)
        })
    })

    describe("methodSignature is MATCH_ORDERS", () => {
        test("it returns MATCH_ORDERS fulfillment method", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.MATCH_ORDERS.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = orderFulfillmentMethod(event)
            assert.stringEquals(retVal!, OrderFulfillmentMethods.MATCH_ORDERS)
        })
    })

    describe("methodSignature is MATCH_ADVANCED_ORDERS", () => {
        test("it returns MATCH_ADVANCED_ORDERS fulfillment method", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.MATCH_ADVANCED_ORDERS.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = orderFulfillmentMethod(event)
            assert.stringEquals(retVal!, OrderFulfillmentMethods.MATCH_ADVANCED_ORDERS)
        })
    })

    describe("methodSignature is not known", () => {
        test("it returns null fulfillment method", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(DUMMY_ADDRESS),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = orderFulfillmentMethod(event)
            assert.assertNull(retVal)
        })
    })
})

describe("tradeStrategy()", () => {
    describe("methodSignature is STANDARD_SALE", () => {
        test("it returns STANDARD_SALE sales strategy", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.FULFILL_BASIC_ORDER.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = tradeStrategy(event)
            assert.stringEquals(retVal, SaleStrategies.STANDARD_SALE)
        })
    })

    describe("methodSignature is FULFILL_ORDER", () => {
        test("it returns ANY_ITEM_FROM_SET sales strategy", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.FULFILL_ORDER.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = tradeStrategy(event)
            assert.stringEquals(retVal, SaleStrategies.ANY_ITEM_FROM_SET)
        })
    })

    describe("methodSignature is FULFILL_ADVANCED_ORDER", () => {
        test("it returns ANY_ITEM_FROM_SET sales strategy", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.FULFILL_ADVANCED_ORDER.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = tradeStrategy(event)
            assert.stringEquals(retVal, SaleStrategies.ANY_ITEM_FROM_SET)
        })
    })

    describe("methodSignature is FULFILL_AVAILABLE_ORDERS", () => {
        test("it returns ANY_ITEM_FROM_SET sales strategy", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.FULFILL_AVAILABLE_ORDERS.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = tradeStrategy(event)
            assert.stringEquals(retVal, SaleStrategies.ANY_ITEM_FROM_SET)
        })
    })

    describe("methodSignature is FULFILL_AVAILABLE_ADVANCED_ORDERS", () => {
        test("it returns ANY_ITEM_FROM_SET sales strategy", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.FULFILL_AVAILABLE_ADVANCED_ORDERS.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = tradeStrategy(event)
            assert.stringEquals(retVal, SaleStrategies.ANY_ITEM_FROM_SET)
        })
    })

    describe("methodSignature is MATCH_ORDERS", () => {
        test("it returns ANY_ITEM_FROM_SET sales strategy", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.MATCH_ORDERS.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = tradeStrategy(event)
            assert.stringEquals(retVal, SaleStrategies.ANY_ITEM_FROM_SET)
        })
    })

    describe("methodSignature is MATCH_ADVANCED_ORDERS", () => {
        test("it returns ANY_ITEM_FROM_SET sales strategy", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(MethodSignatures.MATCH_ADVANCED_ORDERS.substring(2)),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = tradeStrategy(event)
            assert.stringEquals(retVal, SaleStrategies.ANY_ITEM_FROM_SET)
        })
    })

    describe("methodSignature is not known", () => {
        test("it returns STANDARD_SALE sales strategy", () => {
            const event = new ethereum.Event(
                Address.fromString(DUMMY_ADDRESS),
                BigInt.fromU32(1),
                BigInt.fromU32(2),
                "logType",
                new ethereum.Block(
                    Bytes.fromUTF8("hash"),
                    Bytes.fromUTF8("parentHash"),
                    Bytes.fromUTF8("uncleHash"),
                    Address.fromString(DUMMY_ADDRESS),
                    Bytes.fromUTF8("stateRoot"),
                    Bytes.fromUTF8("transactionsRoot"),
                    Bytes.fromUTF8("receiptsRoot"),
                    BigInt.fromU32(1),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    BigInt.fromU32(5),
                    BigInt.fromU32(6),
                    BigInt.fromU32(7),
                    BigInt.fromU32(8),
                ),
                new ethereum.Transaction(
                    Bytes.fromUTF8("hash"),
                    BigInt.fromU32(1),
                    Address.fromString(DUMMY_ADDRESS),
                    Address.fromString(DUMMY_ADDRESS),
                    BigInt.fromU32(2),
                    BigInt.fromU32(3),
                    BigInt.fromU32(4),
                    Bytes.fromHexString(DUMMY_ADDRESS),
                    BigInt.fromU32(5)
                ),
                [],
                null,
            )

            const retVal = tradeStrategy(event)
            assert.stringEquals(retVal, SaleStrategies.STANDARD_SALE)
        })
    })
})