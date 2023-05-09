//// ERC721 Auction
import { assert, createMockedFunction, clearStore, test, newMockEvent, newMockCall, countEntities, mockIpfsFile, beforeAll, describe, afterEach, afterAll, logStore } from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes, ethereum, store, Value, ipfs } from "@graphprotocol/graph-ts"

import { AtomicMatch_Call__Inputs, AtomicMatch_Call } from "../../generated/OpenSea/OpenSea"
import { handleAtomicMatch } from "../../src/mappings"
import { ByteArray } from '../../node_modules/@graphprotocol/graph-ts/common/collections';
import { typeConversion } from '../../node_modules/@graphprotocol/graph-ts/common/conversion';
import { ERC721_INTERFACE_IDENTIFIER } from "../../src/constants";
import { User } from "../../generated/schema";

const addrs: Array<Address> = [
    Address.fromString("0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b"),
    Address.fromString("0xA64c093D999d2C71c80b5b5769DC5668fee98959"),
    Address.fromString("0x4f0A954DE3430C5486D601813Bdb5efCF598BFdd"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x0111Ac7E9425c891f935C4CE54cF16Db7C14B7DB"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b"),
    Address.fromString("0x4f0A954DE3430C5486D601813Bdb5efCF598BFdd"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x5b3256965e7C3cF26E11FCAf296DfC8807C01073"),
    Address.fromString("0x0111Ac7E9425c891f935C4CE54cF16Db7C14B7DB"),
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x0000000000000000000000000000000000000000")]


const uints: Array<BigInt> = [
    BigInt.fromI32(250), BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI64(40000000000000000), BigInt.fromI32(0),
    BigInt.fromI32(1554499048), BigInt.fromI32(0), BigInt.fromI64(29891983438970625420760248666781157982491050021830748884413098760972748508923),
    BigInt.fromI32(250), BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI64(40000000000000000), BigInt.fromI64(20800000000000003),
    BigInt.fromI32(1554411843), BigInt.fromI32(1554843941), BigInt.fromI64(7739247457182685167662492624226718548169051231480611426184896654550464784676)
]

const feeMethodsSidesKindsHowToCalls: Array<i32> = [1, 0, 0, 0, 1, 1, 1, 0]


const calldataBuy: Bytes = Bytes.fromHexString("0x23b872dd0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a64c093d999d2c71c80b5b5769dc5668fee989590000000000000000000000000000000000000000000000000000000000000691")
const calldataSell: Bytes = Bytes.fromHexString("0x23b872dd0000000000000000000000004f0a954de3430c5486d601813bdb5efcf598bfdd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000691")
const replacementPatternBuy: Bytes = Bytes.fromHexString("0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000")
const replacementPatternSell: Bytes = Bytes.fromHexString("0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000")
const staticExtradataBuy: Bytes = Bytes.fromHexString("")
const staticExtradataSell: Bytes = Bytes.fromHexString("")
const vs: Array<i32> = [27, 27]
const rssMetadata: Array<Bytes> = [
    Bytes.fromHexString("0x78bf41370095efbc626a0f71062d1b67f3328fa475de3427dd4e8cb584255846"),
    Bytes.fromHexString("0x3fef7cbd31a2ee5ee9c1d6b7ebf13f9fda119cc18f0d52d4864297587456233a"),
    Bytes.fromHexString("0x78bf41370095efbc626a0f71062d1b67f3328fa475de3427dd4e8cb584255846"),
    Bytes.fromHexString("0x3fef7cbd31a2ee5ee9c1d6b7ebf13f9fda119cc18f0d52d4864297587456233a"),
    Bytes.fromHexString("0x95cb76c2aa96436fb09a4c41e7e3b2f199838aaa000000000000000000000000")
]


const support_interface = Bytes.fromHexString("0x80ac58cd")

test("Can save transaction from call handler", () => {
    let call = changetype<AtomicMatch_Call>(newMockCall())

    let contractAddress = Address.fromString('0x0111Ac7E9425c891f935C4CE54cF16Db7C14B7DB')
    let expectedResult = Address.fromString('0x90cBa2Bbb19ecc291A12066Fd8329D65FA1f1947')
    let bigIntParam = BigInt.fromString('1234')
    createMockedFunction(contractAddress, 'supportsInterface', 'supportsInterface(bytes4):(bool)')
        .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER))])
        .returns([ethereum.Value.fromBoolean(true)])

    createMockedFunction(contractAddress, 'tokenURI', 'tokenURI(uint256):(string)')
        .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1681))])
        .returns([ethereum.Value.fromString("pass")])

    // createMockedFunction(contractAddress, 'tokenURI', 'tokenURI(uint256):(string)')
    // .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(2052))])
    // .returns([ethereum.Value.fromString("pass")])

    createMockedFunction(contractAddress, 'name', 'name():(string)')
        .returns([ethereum.Value.fromString("pass")])

    createMockedFunction(contractAddress, 'symbol', 'symbol():(string)')
        .returns([ethereum.Value.fromString("pass")])

    createMockedFunction(contractAddress, 'totalSupply', 'totalSupply():(uint256)')
        .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1234'))])


    call.inputValues = [new ethereum.EventParam("addrs", ethereum.Value.fromAddressArray(addrs)),
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
})

// //from 0x4f0A954DE3430C5486D601813Bdb5efCF598BFdd
// //to 0xA64c093D999d2C71c80b5b5769DC5668fee98959
