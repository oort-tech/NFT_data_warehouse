import { assert, createMockedFunction, clearStore, test, newMockEvent, newMockCall, countEntities, mockIpfsFile, beforeAll, describe, afterEach, afterAll, logStore } from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes, ethereum, store, Value, ipfs } from "@graphprotocol/graph-ts"

import { AtomicMatch_Call__Inputs, AtomicMatch_Call } from "../../generated/OpenSea/OpenSea"
import { handleAtomicMatch} from "../../src/mappings"
import { ByteArray } from '../../node_modules/@graphprotocol/graph-ts/common/collections';
import { typeConversion } from '../../node_modules/@graphprotocol/graph-ts/common/conversion';
import { ERC1155_INTERFACE_IDENTIFIER, ERC721_INTERFACE_IDENTIFIER, NftStandard, SaleKind } from "../../src/constants";
import { Asset, Collection, Trade, User } from "../../generated/schema";

// https://etherscan.io/tx/0xf28a9ab8d8aafd962198701443b35db3d403d46dc8f880b1ebfd599648e30c0a
// TX-Hash: 0xf28a9ab8d8aafd962198701443b35db3d403d46dc8f880b1ebfd599648e30c0a
// 0x238f2d6787DaCB6045d72B0Ec6626DE0ff7C3107
const addrs: Array<Address> = [
    Address.fromString("0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b"),
    Address.fromString("0x5492e0112e49E5Fed0a7B1278c76df655e509A99"),
    Address.fromString("0x530cF036Ed4Fa58f7301a9C788C9806624ceFD19"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x238f2d6787DaCB6045d72B0Ec6626DE0ff7C3107"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b"),
    Address.fromString("0x530cF036Ed4Fa58f7301a9C788C9806624ceFD19"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x5b3256965e7C3cF26E11FCAf296DfC8807C01073"),
    Address.fromString("0x238f2d6787DaCB6045d72B0Ec6626DE0ff7C3107"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x0000000000000000000000000000000000000000")];

const uints: Array<BigInt> =[
    BigInt.fromI32(750),
    BigInt.fromI32(0),
    BigInt.fromI32(0),
    BigInt.fromI32(0),
    BigInt.fromI64(130000000000000000),
    BigInt.fromI32(0),
    BigInt.fromI32(1576188015),
    BigInt.fromI32(0),
    BigInt.fromI64(71686526223470996317918959245839465498248059124381306916847136780648304690112),
    BigInt.fromI32(750),
    BigInt.fromI32(0),
    BigInt.fromI32(0),
    BigInt.fromI32(0),
    BigInt.fromI64(130000000000000000),
    BigInt.fromI64(130000000000000000),
    BigInt.fromI32(1576187416),
    BigInt.fromI32(1576619506),
    BigInt.fromI64(7470168931196138774814853943051341708919090843446820956933300183561428730206)];

const feeMethodsSidesKindsHowToCalls: Array<i32> = [1,0,0,0,1,1,1,0];

let contractAddress=Address.fromString("0x238f2d6787DaCB6045d72B0Ec6626DE0ff7C3107");

const calldataBuy: Bytes = Bytes.fromHexString("0xf242432a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000005492e0112e49e5fed0a7b1278c76df655e509a99000000000000000000000000000000000000000000000000000000000000001b000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000");
const calldataSell: Bytes = Bytes.fromHexString("0xf242432a000000000000000000000000530cf036ed4fa58f7301a9c788c9806624cefd190000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000");
const replacementPatternBuy: Bytes = Bytes.fromHexString("0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
const replacementPatternSell: Bytes = Bytes.fromHexString("0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
const staticExtradataBuy: Bytes = Bytes.fromHexString("");
const staticExtradataSell: Bytes = Bytes.fromHexString("");
const vs: Array<i32> =[28,28];
const rssMetadata: Array<Bytes> =[
    Bytes.fromHexString("0x14409d527a4bd068561f39fa65dc0eae871eb34e370aa24e239b0c43ed78e2b1"),
    Bytes.fromHexString("0x78fb9cc6d2aff7539f37629627f056c8386fa335ab96cf34cd3cbcffaa4e9607"),
    Bytes.fromHexString("0x14409d527a4bd068561f39fa65dc0eae871eb34e370aa24e239b0c43ed78e2b1"),
    Bytes.fromHexString("0x78fb9cc6d2aff7539f37629627f056c8386fa335ab96cf34cd3cbcffaa4e9607"),
    Bytes.fromHexString("0x58023f890f468a4bf36c23e690f6642e9b0cdd46000000000000000000000000")
];


createMockedFunction(contractAddress, 'supportsInterface', 'supportsInterface(bytes4):(bool)')
    .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER))])
    .returns([ethereum.Value.fromBoolean(false)]);

createMockedFunction(contractAddress, 'supportsInterface', 'supportsInterface(bytes4):(bool)')
    .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER))])
    .returns([ethereum.Value.fromBoolean(true)]);

createMockedFunction(contractAddress, 'uri', 'uri(uint256):(string)')
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(27))])
    .returns([ethereum.Value.fromString("pass")]);

createMockedFunction(contractAddress, 'name', 'name():(string)')
    .returns([ethereum.Value.fromString("pass")]);

createMockedFunction(contractAddress, 'symbol', 'symbol():(string)')
    .returns([ethereum.Value.fromString("pass")]);

    createMockedFunction(contractAddress, 'totalSupply', 'totalSupply():(uint256)')
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1234'))]);

test("Can save transaction from call handler", () => {
    let call = changetype<AtomicMatch_Call>(newMockCall());
    call.inputValues = [new ethereum.EventParam("addrs",ethereum.Value.fromAddressArray(addrs)), 
    new ethereum.EventParam("uints",ethereum.Value.fromUnsignedBigIntArray(uints)), 
    new ethereum.EventParam("feeMethodsSidesKindsHowToCalls",ethereum.Value.fromI32Array(feeMethodsSidesKindsHowToCalls)), 
    new ethereum.EventParam("calldataBuy",ethereum.Value.fromBytes(calldataBuy)), 
    new ethereum.EventParam("calldataSell",ethereum.Value.fromBytes(calldataSell)), 
    new ethereum.EventParam("replacementPatternBuy",ethereum.Value.fromBytes(replacementPatternBuy)), 
    new ethereum.EventParam("replacementPatternSell",ethereum.Value.fromBytes(replacementPatternSell)),
    new ethereum.EventParam("staticExtradataBuy",ethereum.Value.fromBytes(staticExtradataBuy)), 
    new ethereum.EventParam("staticExtradataSell",ethereum.Value.fromBytes(staticExtradataSell)), 
    new ethereum.EventParam("vs",ethereum.Value.fromI32Array(vs)), 
    new ethereum.EventParam("rssMetadata",ethereum.Value.fromBytesArray(rssMetadata))
    ];
    handleAtomicMatch(call);
    let buyer = User.load("0x5492e0112e49e5fed0a7b1278c76df655e509a99".toLowerCase())!;
    
    assert.assertTrue(buyer.assets.length == 1)
    assert.assertTrue(buyer.purchases.length == 1)

    let seller = User.load("0x530cF036Ed4Fa58f7301a9C788C9806624ceFD19".toLowerCase())!;

    assert.assertTrue(seller.sales.length == 1);

    let asset = Asset.load(buyer.assets[0])!;
    let trade = Trade.load(seller.sales[0])!;

    assert.assertTrue(asset.id == trade.asset);
    assert.assertTrue(asset.tokenId == BigInt.fromI64(27));
    assert.assertTrue(asset.tokenURI == "pass");
    assert.assertTrue(trade.saleKind == SaleKind.AUCTION);

    let collection = Collection.load(asset.collection)!;
    assert.assertTrue(collection.nftStandard == NftStandard.ERC1155);
    assert.assertTrue(collection.id == asset.collection);
  })

test("This test should fail", () => {
    let call = changetype<AtomicMatch_Call>(newMockCall());

    call.inputValues = [new ethereum.EventParam("displayName", ethereum.Value.fromString("name"))];
    // call.inputValues = [addrs, uints, feeMethodsSidesKindsHowToCalls, calldataBuy, calldataSell, replacementPatternBuy, replacementPatternSell, 
    //     staticExtradataBuy, staticExtradataSell, vs, rssMetadata];
    handleAtomicMatch(call);
  }, true)
