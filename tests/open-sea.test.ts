import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Bytes, Address, BigInt } from "@graphprotocol/graph-ts"
import { OrderApprovedPartOne } from "../generated/schema"
import { OrderApprovedPartOne as OrderApprovedPartOneEvent } from "../generated/OpenSea/OpenSea"
import { handleOrderApprovedPartOne } from "../src/open-sea"
import { createOrderApprovedPartOneEvent } from "./open-sea-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let hash = Bytes.fromI32(1234567890)
    let exchange = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let maker = Address.fromString("0x0000000000000000000000000000000000000001")
    let taker = Address.fromString("0x0000000000000000000000000000000000000001")
    let makerRelayerFee = BigInt.fromI32(234)
    let takerRelayerFee = BigInt.fromI32(234)
    let makerProtocolFee = BigInt.fromI32(234)
    let takerProtocolFee = BigInt.fromI32(234)
    let feeRecipient = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let feeMethod = 123
    let side = 123
    let saleKind = 123
    let target = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newOrderApprovedPartOneEvent = createOrderApprovedPartOneEvent(
      hash,
      exchange,
      maker,
      taker,
      makerRelayerFee,
      takerRelayerFee,
      makerProtocolFee,
      takerProtocolFee,
      feeRecipient,
      feeMethod,
      side,
      saleKind,
      target
    )
    handleOrderApprovedPartOne(newOrderApprovedPartOneEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("OrderApprovedPartOne created and stored", () => {
    assert.entityCount("OrderApprovedPartOne", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "hash",
      "1234567890"
    )
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "exchange",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "maker",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "taker",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "makerRelayerFee",
      "234"
    )
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "takerRelayerFee",
      "234"
    )
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "makerProtocolFee",
      "234"
    )
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "takerProtocolFee",
      "234"
    )
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "feeRecipient",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "feeMethod",
      "123"
    )
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "side",
      "123"
    )
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "saleKind",
      "123"
    )
    assert.fieldEquals(
      "OrderApprovedPartOne",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "target",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
