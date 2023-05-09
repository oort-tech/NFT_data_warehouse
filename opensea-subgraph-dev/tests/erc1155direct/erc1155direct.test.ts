import { assert, createMockedFunction, clearStore, test, newMockEvent, newMockCall, countEntities, mockIpfsFile, beforeAll, describe, afterEach, afterAll, logStore } from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes, ethereum, store, Value, ipfs } from "@graphprotocol/graph-ts"

import { AtomicMatch_Call__Inputs, AtomicMatch_Call } from "../../generated/OpenSea/OpenSea"
import { handleAtomicMatch} from "../../src/mappings"
import { ByteArray } from '../../node_modules/@graphprotocol/graph-ts/common/collections';
import { typeConversion } from '../../node_modules/@graphprotocol/graph-ts/common/conversion';
import { ERC1155_INTERFACE_IDENTIFIER, ERC721_INTERFACE_IDENTIFIER } from "../../src/constants";

// https://etherscan.io/tx/0x1d834d8a0000fcf11ac1656acc2491326c1f1c39666b97005266a3e3a290c6e3
// TX-Hash: 0x1d834d8a0000fcf11ac1656acc2491326c1f1c39666b97005266a3e3a290c6e3
// 0x238f2d6787DaCB6045d72B0Ec6626DE0ff7C3107
const addrs: Array<Address> = [
    Address.fromString("0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b"),
    Address.fromString("0x114558d984bb24FDDa0CD279Ffd5F073F2d44F49"),
    Address.fromString("0xC5143358DCc5d0e524B9E3bc73e75310ACE0e99d"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x238f2d6787DaCB6045d72B0Ec6626DE0ff7C3107"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b"),
    Address.fromString("0xC5143358DCc5d0e524B9E3bc73e75310ACE0e99d"),
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
    BigInt.fromI64(30000000000000000),
    BigInt.fromI32(0),
    BigInt.fromI32(1580441430),
    BigInt.fromI32(0),
    BigInt.fromI64(91688958882944142007280920626604061574185663115797611328388830886007468559584),
    BigInt.fromI32(750),
    BigInt.fromI32(0),
    BigInt.fromI32(0),
    BigInt.fromI32(0),
    BigInt.fromI64(30000000000000000),
    BigInt.fromI32(0),
    BigInt.fromI32(1580426383),
    BigInt.fromI32(0),
    BigInt.fromI64(94500723851803633916748745798673994742842938153087971399314700691544444429108)];

const feeMethodsSidesKindsHowToCalls: Array<i32> = [1,0,0,0,1,1,0,0];

let contractAddress=Address.fromString("0x238f2d6787DaCB6045d72B0Ec6626DE0ff7C3107");

const calldataBuy: Bytes = Bytes.fromHexString("0xf242432a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000114558d984bb24fdda0cd279ffd5f073f2d44f49000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000");
const calldataSell: Bytes = Bytes.fromHexString("0xf242432a000000000000000000000000c5143358dcc5d0e524b9e3bc73e75310ace0e99d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000");
const replacementPatternBuy: Bytes = Bytes.fromHexString("0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
const replacementPatternSell: Bytes = Bytes.fromHexString("0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
const staticExtradataBuy: Bytes = Bytes.fromHexString("");
const staticExtradataSell: Bytes = Bytes.fromHexString("");
const vs: Array<i32> =[28,28];
const rssMetadata: Array<Bytes> =[
    Bytes.fromHexString("0xe15de82a642c97c34fbc42cd715fd003f4549fab03e45b66ca6eb6a1df03e67f"),
    Bytes.fromHexString("0x64b66ed12238d1b8b957baf941866b7198c967c98cacdc5a44af64a8ba846a69"),
    Bytes.fromHexString("0xe15de82a642c97c34fbc42cd715fd003f4549fab03e45b66ca6eb6a1df03e67f"),
    Bytes.fromHexString("0x64b66ed12238d1b8b957baf941866b7198c967c98cacdc5a44af64a8ba846a69"),
    Bytes.fromHexString("0x58023f890f468a4bf36c23e690f6642e9b0cdd46000000000000000000000000")
];


createMockedFunction(contractAddress, 'supportsInterface', 'supportsInterface(bytes4):(bool)')
    .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER))])
    .returns([ethereum.Value.fromBoolean(false)]);

createMockedFunction(contractAddress, 'supportsInterface', 'supportsInterface(bytes4):(bool)')
    .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER))])
    .returns([ethereum.Value.fromBoolean(true)]);

createMockedFunction(contractAddress, 'uri', 'uri(uint256):(string)')
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(14))])
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
  })

test("This test should fail", () => {
    let call = changetype<AtomicMatch_Call>(newMockCall());

    call.inputValues = [new ethereum.EventParam("displayName", ethereum.Value.fromString("name"))];
    // call.inputValues = [addrs, uints, feeMethodsSidesKindsHowToCalls, calldataBuy, calldataSell, replacementPatternBuy, replacementPatternSell, 
    //     staticExtradataBuy, staticExtradataSell, vs, rssMetadata];
    handleAtomicMatch(call);
  }, true)
