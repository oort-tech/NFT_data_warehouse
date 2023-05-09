import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";

// method signatures are instantitiated here on etherscan: https://etherscan.io/address/0x00000000006c3852cbef3e08e8df289169ede581#writeContract
export namespace MethodSignatures {
  export const FULFILL_BASIC_ORDER = "0XFB0F3EE1"
  export const FULFILL_ORDER = "0XB3A34C4C"
  export const FULFILL_ADVANCED_ORDER = "0XE7ACAB24"
  export const FULFILL_AVAILABLE_ORDERS = "0XED98A574"
  export const FULFILL_AVAILABLE_ADVANCED_ORDERS = "0X87201B41"
  export const MATCH_ORDERS = "0XA8174404"
  export const MATCH_ADVANCED_ORDERS = "0X55944A42"
}

// these methods are defined here: https://docs.opensea.io/reference/seaport-overview
export namespace OrderFulfillmentMethods {
  export const FULFILL_BASIC_ORDER = "FULFILL_BASIC_ORDER" 
  export const FULFILL_ORDER = "FULFILL_ORDER" 
  export const FULFILL_ADVANCED_ORDER = "FULFILL_ADVANCED_ORDER" 
  export const FULFILL_AVAILABLE_ORDERS = "FULFILL_AVAILABLE_ORDERS"
  export const FULFILL_AVAILABLE_ADVANCED_ORDERS = "FULFILL_AVAILABLE_ADVANCED_ORDERS"
  export const MATCH_ORDERS = "MATCH_ORDERS" 
  export const MATCH_ADVANCED_ORDERS = "MATCH_ADVANCED_ORDERS" 
}

export const PROTOCOL_SCHEMA_VERSION = "1.0";

// options for different networks subgraph can be deployed to; only use mainnet for now
export namespace Network {
  export const MAINNET = "MAINNET";
}

export namespace NFTStandards {
  export const ERC721 = "ERC721";
  export const ERC1155 = "ERC1155";
  export const UNKNOWN = "UNKNOWN";
}

export namespace SaleStrategies {
  export const STANDARD_SALE = "STANDARD_SALE";
  export const ANY_ITEM_FROM_COLLECTION = "ANY_ITEM_FROM_COLLECTION";
  export const ANY_ITEM_FROM_SET = "ANY_ITEM_FROM_SET";
  export const DUTCH_AUCTION = "DUTCH_AUCTION";
  export const PRIVATE_SALE = "PRIVATE_SALE";
}

// These are defined in seaport smart contracts: https://github.com/ProjectOpenSea/seaport/blob/main/contracts/lib/ConsiderationEnums.sol#L115
export namespace SeaportItemType {
  export const NATIVE = 0;
  export const ERC20 = 1;
  export const ERC721 = 2;
  export const ERC1155 = 3;
  export const ERC721_WITH_CRITERIA = 4;
  export const ERC1155_WITH_CRITERIA = 5;
}

// these are just used for convenient so we don't have to keep typing these functions over and over...
export const BIGINT_ZERO = BigInt.zero();
export const BIGDECIMAL_ZERO = BigDecimal.zero();
export const BIGDECIMAL_MAX = BigInt.fromI32(i32.MAX_VALUE).toBigDecimal();
export const MANTISSA_FACTOR = BigInt.fromI32(10)
  .pow(18 as u8)
  .toBigDecimal();
export const BIGDECIMAL_HUNDRED = BigInt.fromI32(100).toBigDecimal();
export const SECONDS_PER_DAY = 24 * 60 * 60;

export const ERC721_INTERFACE_IDENTIFIER = "0x80ac58cd"; // defined here https://eips.ethereum.org/EIPS/eip-721
export const ERC1155_INTERFACE_IDENTIFIER = "0xd9b67a26"; // defined here https://eips.ethereum.org/EIPS/eip-1155

// This is found https://etherscan.io/address/0x8de9c5a032463c561423387a9648c5c7bcc5bc90
export const OPENSEA_FEES_ACCOUNT = Address.fromString(
  "0x8de9c5a032463c561423387a9648c5c7bcc5bc90"
);
// This can be found https://github.com/web3w/seaport-js/blob/399fa568c04749fd8f96829fa7a6b73d1e440458/src/contracts/index.ts#L30
export const OPENSEA_ETHEREUM_FEE_COLLECTOR = Address.fromString(
  "0x0000a26b00c1F0DF003000390027140000fAa719"
);

export function min(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? a : b;
}

export function max(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? b : a;
}

// only ERC20 tokens (WETH) or native ETH are considered forms of payment for NFT
export function isMoney(itemType: i32): boolean {
  return (
    itemType == SeaportItemType.NATIVE || 
    itemType == SeaportItemType.ERC20
  );
}

// these are defined as the only NFTs offered on the exchange here: https://docs.opensea.io/reference/seaport-overview
export function isNFT(itemType: i32): boolean {
  return (
    itemType == SeaportItemType.ERC721 ||
    itemType == SeaportItemType.ERC1155 ||
    itemType == SeaportItemType.ERC721_WITH_CRITERIA ||
    itemType == SeaportItemType.ERC1155_WITH_CRITERIA
  );
}

export function isERC721(itemType: i32): boolean {
  return (
    itemType == SeaportItemType.ERC721 ||
    itemType == SeaportItemType.ERC721_WITH_CRITERIA
  );
}

export function isERC1155(itemType: i32): boolean {
  return (
    itemType == SeaportItemType.ERC1155 ||
    itemType == SeaportItemType.ERC1155_WITH_CRITERIA
  );
}

export function isOpenSeaFeeAccount(address: Address): boolean {
  return (
    address == OPENSEA_FEES_ACCOUNT ||
    address == OPENSEA_ETHEREUM_FEE_COLLECTOR
  );
}

// check what order fulfillment method is defined based on the signature of the OrderFulfilled event
export function orderFulfillmentMethod(event:ethereum.Event):string | null {
  const methodSignature = event.transaction.input.toHexString().slice(0,10).toUpperCase()

  let fulfillmentType: string | null = null
  if(methodSignature == MethodSignatures.FULFILL_BASIC_ORDER.toUpperCase()) {
    fulfillmentType = OrderFulfillmentMethods.FULFILL_BASIC_ORDER
  }

  if(methodSignature == MethodSignatures.FULFILL_ORDER) {
    fulfillmentType = OrderFulfillmentMethods.FULFILL_ORDER
  }

  if(methodSignature == MethodSignatures.FULFILL_ADVANCED_ORDER) {
    fulfillmentType = OrderFulfillmentMethods.FULFILL_ADVANCED_ORDER
  }

  if(methodSignature == MethodSignatures.FULFILL_AVAILABLE_ORDERS) {
    fulfillmentType = OrderFulfillmentMethods.FULFILL_AVAILABLE_ORDERS
  }
  
  if(methodSignature == MethodSignatures.FULFILL_AVAILABLE_ADVANCED_ORDERS) {
    fulfillmentType = OrderFulfillmentMethods.FULFILL_AVAILABLE_ADVANCED_ORDERS
  }

  if(methodSignature == MethodSignatures.MATCH_ORDERS) {
    fulfillmentType = OrderFulfillmentMethods.MATCH_ORDERS
  }

  if(methodSignature == MethodSignatures.MATCH_ADVANCED_ORDERS) {
    fulfillmentType = OrderFulfillmentMethods.MATCH_ADVANCED_ORDERS
  }

  return fulfillmentType;
}

// check what trade strategy is defined based on the signature of the OrderFulfilled event
export function tradeStrategy(event:ethereum.Event):string {
  const methodSignature = event.transaction.input.toHexString().slice(0,10).toUpperCase()

  let strategy = SaleStrategies.STANDARD_SALE; // default to this
  if(methodSignature == MethodSignatures.FULFILL_BASIC_ORDER) {
    strategy = SaleStrategies.STANDARD_SALE
  }

  if(methodSignature == MethodSignatures.FULFILL_ORDER) {
    strategy = SaleStrategies.ANY_ITEM_FROM_SET
  }

  if(methodSignature == MethodSignatures.FULFILL_ADVANCED_ORDER) {
    strategy = SaleStrategies.ANY_ITEM_FROM_SET
  }

  if(methodSignature == MethodSignatures.FULFILL_AVAILABLE_ORDERS) {
    strategy = SaleStrategies.ANY_ITEM_FROM_SET
  }
  
  if(methodSignature == MethodSignatures.FULFILL_AVAILABLE_ADVANCED_ORDERS) {
    strategy = SaleStrategies.ANY_ITEM_FROM_SET
  }

  if(methodSignature == MethodSignatures.MATCH_ORDERS) {
    strategy = SaleStrategies.ANY_ITEM_FROM_SET
  }

  if(methodSignature == MethodSignatures.MATCH_ADVANCED_ORDERS) {
    strategy = SaleStrategies.ANY_ITEM_FROM_SET
  }

  return strategy;
}