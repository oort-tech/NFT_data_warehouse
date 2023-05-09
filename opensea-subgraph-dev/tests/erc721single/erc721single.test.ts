import { assert, createMockedFunction, clearStore, test, newMockEvent, newMockCall, countEntities, mockIpfsFile, beforeAll, describe, afterEach, afterAll, logStore } from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes, ethereum, store, Value, ipfs, log } from "@graphprotocol/graph-ts"

import { AtomicMatch_Call__Inputs, AtomicMatch_Call } from "../../generated/OpenSea/OpenSea"
import { handleAtomicMatch } from "../../src/mappings"
import { ERC721_INTERFACE_IDENTIFIER, NftStandard, SaleKind } from "../../src/constants";
import { Asset, Collection, Trade, User } from "../../generated/schema";

const addrs: Array<Address> = [
    Address.fromString("0x7f268357A8c2552623316e2562D90e642bB538E5"),
    Address.fromString("0xA508c16666C5B8981Fa46Eb32784Fccc01942A71"),
    Address.fromString("0x27C934Ea235abD41bDd7Cfb48f7B1Bb9e629dB57"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0xBAf2127B49fC93CbcA6269FAdE0F7F31dF4c88a7"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x7f268357A8c2552623316e2562D90e642bB538E5"),
    Address.fromString("0x27C934Ea235abD41bDd7Cfb48f7B1Bb9e629dB57"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x5b3256965e7C3cF26E11FCAf296DfC8807C01073"),
    Address.fromString("0xBAf2127B49fC93CbcA6269FAdE0F7F31dF4c88a7"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x0000000000000000000000000000000000000000")]


const uints: Array<BigInt> = [
    BigInt.fromI32(750), BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI64(100000000000000000), BigInt.fromI32(0),
    BigInt.fromI32(1648171456), BigInt.fromI32(0), BigInt.fromI64(93288672916028159238602434781950608536557289734567850006164150073607207540549),
    BigInt.fromI32(750), BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI64(100000000000000000), BigInt.fromI32(0),
    BigInt.fromI32(1648169487), BigInt.fromI32(1648437437), BigInt.fromI64(61938118526470877781341999049879813458282473141896078992135147791069526745945)
]

const feeMethodsSidesKindsHowToCalls: Array<i32> = [1, 0, 0, 1, 1, 1, 0, 1]

const calldataBuy: Bytes = Bytes.fromHexString("0xfb16a5950000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a508c16666c5b8981fa46eb32784fccc01942a71000000000000000000000000db3b2e1f699caf230ee75bfbe7d97d70f81bc9450000000000000000000000000000000000000000000000000000000000000804000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000")
const calldataSell: Bytes = Bytes.fromHexString("0xfb16a59500000000000000000000000027c934ea235abd41bdd7cfb48f7b1bb9e629db570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000db3b2e1f699caf230ee75bfbe7d97d70f81bc9450000000000000000000000000000000000000000000000000000000000000804000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000")
const replacementPatternBuy: Bytes = Bytes.fromHexString("0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000")
const replacementPatternSell: Bytes = Bytes.fromHexString("0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000")
const staticExtradataBuy: Bytes = Bytes.fromHexString("")
const staticExtradataSell: Bytes = Bytes.fromHexString("")
const vs: Array<i32> = [28, 28]
const rssMetadata: Array<Bytes> = [
    Bytes.fromHexString("0xbb9f50fecd73ca9c8c7fbf47c0dc12d1d725490f17dcc25eb61861a9585c12fd"),
    Bytes.fromHexString("0x4eee8194f1cc9bfd19c7fcdc46972ece535abb4e01a87fcf0f4733e248901227"),
    Bytes.fromHexString("0xbb9f50fecd73ca9c8c7fbf47c0dc12d1d725490f17dcc25eb61861a9585c12fd"),
    Bytes.fromHexString("0x4eee8194f1cc9bfd19c7fcdc46972ece535abb4e01a87fcf0f4733e248901227"),
    Bytes.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000000")
]

test("Can save transaction from call handler", () => {
    let call = changetype<AtomicMatch_Call>(newMockCall())
    let contractAddress = Address.fromString('0xDb3B2e1F699CaF230eE75bfBE7d97d70F81bC945')
    createMockedFunction(contractAddress, 'supportsInterface', 'supportsInterface(bytes4):(bool)')
        .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER))])
        .returns([ethereum.Value.fromBoolean(true)])

    const tokenId = 2052
    createMockedFunction(contractAddress, 'tokenURI', 'tokenURI(uint256):(string)')
        .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(tokenId))])
        .returns([ethereum.Value.fromString("pass")])

    createMockedFunction(contractAddress, 'name', 'name():(string)')
        .returns([ethereum.Value.fromString("pass")])

    createMockedFunction(contractAddress, 'symbol', 'symbol():(string)')
        .returns([ethereum.Value.fromString("pass")])

    createMockedFunction(contractAddress, 'totalSupply', 'totalSupply():(uint256)')
        .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1234'))])

    call.inputValues = [
        new ethereum.EventParam("addrs", ethereum.Value.fromAddressArray(addrs)),
        new ethereum.EventParam("uints", ethereum.Value.fromUnsignedBigIntArray(uints)),
        new ethereum.EventParam("feeMethodsSidesKindsHowToCalls", ethereum.Value.fromI32Array(feeMethodsSidesKindsHowToCalls)),
        new ethereum.EventParam("calldataBuy", ethereum.Value.fromBytes(calldataBuy)),
        new ethereum.EventParam("calldataSell", ethereum.Value.fromBytes(calldataSell)),
        new ethereum.EventParam("replacementPatternBuy", ethereum.Value.fromBytes(replacementPatternBuy)),
        new ethereum.EventParam("replacementPatternSell", ethereum.Value.fromBytes(replacementPatternSell)),
        new ethereum.EventParam("staticExtradataBuy", ethereum.Value.fromBytes(staticExtradataBuy)),
        new ethereum.EventParam("staticExtradataSell", ethereum.Value.fromBytes(staticExtradataSell)),
        new ethereum.EventParam("vs", ethereum.Value.fromI32Array(vs)),
        new ethereum.EventParam("rssMetadata", ethereum.Value.fromBytesArray(rssMetadata))
    ]

    handleAtomicMatch(call)
    
    let buyer = User.load("0xA508c16666C5B8981Fa46Eb32784Fccc01942A71".toLowerCase())!;
    
    assert.assertTrue(buyer.assets.length == 1)
    assert.assertTrue(buyer.purchases.length == 1)

    let seller = User.load("0x27C934Ea235abD41bDd7Cfb48f7B1Bb9e629dB57".toLowerCase())!;

    assert.assertTrue(seller.sales.length == 1);

    let asset = Asset.load(buyer.assets[0])!;
    let trade = Trade.load(seller.sales[0])!;

    assert.assertTrue(asset.id == trade.asset);
    assert.assertTrue(asset.tokenId == BigInt.fromI64(tokenId));
    assert.assertTrue(asset.tokenURI == "pass");
    assert.assertTrue(trade.saleKind == SaleKind.DIRECT_PURCHASE);

    let collection = Collection.load(asset.collection)!;
    assert.assertTrue(collection.nftStandard == NftStandard.ERC721);
    assert.assertTrue(collection.id == asset.collection);
})
