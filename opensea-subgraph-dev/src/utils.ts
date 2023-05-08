import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";
import { AtomicMatch_Call } from "../generated/OpenSea/OpenSea";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  ERC1155_INTERFACE_IDENTIFIER,
  ERC1155_SAFE_TRANSFER_FROM_SELECTOR,
  ERC721_INTERFACE_IDENTIFIER,
  ERC721_SAFE_TRANSFER_FROM_SELECTOR,
  ETHABI_DECODE_PREFIX,
  MATCH_ERC1155_SAFE_TRANSFER_FROM_SELECTOR,
  MATCH_ERC721_SAFE_TRANSFER_FROM_SELECTOR,
  MATCH_ERC721_TRANSFER_FROM_SELECTOR,
  NULL_ADDRESS,
  NUM_WEI_IN_ETH,
  NftStandard,
  SaleKind,
  Side,
  TRANSFER_FROM_SELECTOR,
} from "./constants";
import { ERC165 } from "../generated/OpenSea/ERC165";
import { NftMetadata } from "../generated/OpenSea/NftMetadata";
import { Asset, Collection, User } from "../generated/schema";
import { log } from '@graphprotocol/graph-ts'

export class DecodedTransferResult {
  constructor(
    public readonly functionSelector: string,
    public readonly from: Address,
    public readonly to: Address,
    public readonly token: Address,
    public readonly tokenId: BigInt,
    public readonly amount: BigInt
  ) { }
}

export class DecodedAtomicizeResult {
  constructor(
    public readonly targets: Address[],
    public readonly callDatas: Bytes[]
  ) { }
}

/**
 * Get first 4 bytes of the calldata (function selector/method ID)
 */
export function getFunctionSelector(callData: Bytes): string {
  return Bytes.fromUint8Array(callData.subarray(0, 4)).toHexString();
}

/**
 * Get order side from side parameter
 * enum Side { Buy, Sell }
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/SaleKindInterface.sol#L22
 */
export function getOrderSide(side: i32): string {
  if (side == 0) {
    return Side.BUY;
  } else {
    return Side.SELL;
  }
}

/**
 * Get salekind, either DIRECT_PURCHASE or AUCTION
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/SaleKindInterface.sol#L29
 */
export function getSaleKind(saleKind: i32): string {
  if (saleKind == 0) {
    return SaleKind.DIRECT_PURCHASE;
  } else {
    return SaleKind.AUCTION;
  }
}

/**
 * Validate function selectors that can be decoded.
 */
export function validateCallDataFunctionSelector(callData: Bytes): boolean {
  const functionSelector = getFunctionSelector(callData);
  return (
    functionSelector == TRANSFER_FROM_SELECTOR ||
    functionSelector == ERC721_SAFE_TRANSFER_FROM_SELECTOR ||
    functionSelector == ERC1155_SAFE_TRANSFER_FROM_SELECTOR ||
    functionSelector == MATCH_ERC721_TRANSFER_FROM_SELECTOR ||
    functionSelector == MATCH_ERC721_SAFE_TRANSFER_FROM_SELECTOR ||
    functionSelector == MATCH_ERC1155_SAFE_TRANSFER_FROM_SELECTOR
  );
}

/**
 * Split up/atomicize a set of calldata bytes into individual ERC721/1155 transfer calldata bytes
 * Creates a list of calldatas which can be decoded in decodeSingleNftData
 */
export function atomicizeCallData(
  callDatas: Bytes,
  callDataLengths: BigInt[]
): Bytes[] {
  const atomicizedCallData: Bytes[] = [];
  let index = 0;
  for (let i = 0; i < callDataLengths.length; i++) {
    const length = callDataLengths[i].toI32();
    const callData = Bytes.fromUint8Array(
      callDatas.subarray(index, index + length)
    );
    atomicizedCallData.push(callData);
    index += length;
  }

  return atomicizedCallData;
}

/**
 * Calculate the price two orders would match at, if in fact they would match (otherwise fail)
 * Returns sellPrice for sell-side order maker (sale) and buyPrice for buy-side order maker (bid/offer)
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/ExchangeCore.sol#L460
 */
export function calculateMatchPrice(call: AtomicMatch_Call): BigInt {
  const sellSideFeeRecipient = call.inputs.addrs[10];

  const sellSide = call.inputs.feeMethodsSidesKindsHowToCalls[5];
  const sellSaleKind = call.inputs.feeMethodsSidesKindsHowToCalls[6];
  const sellBasePrice = call.inputs.uints[13];
  const sellExtra = call.inputs.uints[14];
  const sellListingTime = call.inputs.uints[15];
  const sellExpirationTime = call.inputs.uints[16];

  // Calculate sell price
  const sellPrice = calculateFinalPrice(
    sellSide,
    sellSaleKind,
    sellBasePrice,
    sellExtra,
    sellListingTime,
    sellExpirationTime,
    call.block.timestamp
  );

  const buySide = call.inputs.feeMethodsSidesKindsHowToCalls[1];
  const buySaleKind = call.inputs.feeMethodsSidesKindsHowToCalls[2];
  const buyBasePrice = call.inputs.uints[4];
  const buyExtra = call.inputs.uints[5];
  const buyListingTime = call.inputs.uints[6];
  const buyExpirationTime = call.inputs.uints[7];

  // Calculate buy price
  const buyPrice = calculateFinalPrice(
    buySide,
    buySaleKind,
    buyBasePrice,
    buyExtra,
    buyListingTime,
    buyExpirationTime,
    call.block.timestamp
  );

  // If is sell-side order, use the sell price (i.e. use the user's listing price),
  // otherwise is buy-side order (i.e. auction), then we use the final buy bid price
  return sellSideFeeRecipient.notEqual(NULL_ADDRESS) ? sellPrice : buyPrice;
}

/**
 * Calculate the settlement price of an order using Order paramters, basically reproducing:
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/master/contracts/exchange/ExchangeCore.sol#L460
 * Returns basePrice if FixedPrice sale or calculate auction settle price if is Aucrion sale
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/SaleKindInterface.sol#L70
 * NOTE: "now" keyword is simply an alias for block.timestamp
 * https://docs.soliditylang.org/en/v0.4.26/units-and-global-variables.html?highlight=now#block-and-transaction-properties
 */
export function calculateFinalPrice(
  side: i32,
  saleKind: i32,
  basePrice: BigInt,
  extra: BigInt,
  listingTime: BigInt,
  expirationTime: BigInt,
  now: BigInt
): BigInt {
  if (getSaleKind(saleKind) == SaleKind.DIRECT_PURCHASE) {
    return basePrice;
  } else if (getSaleKind(saleKind) == SaleKind.AUCTION) {
    const diff = extra
      .times(now.minus(listingTime))
      .div(expirationTime.minus(listingTime));
    if (getOrderSide(side) == Side.SELL) {
      return basePrice.minus(diff);
    } else {
      return basePrice.plus(diff);
    }
  } else {
    return BIGINT_ZERO;
  }
}

/**
 * Replace bytes in an array with bytes in another array, guarded by a bitmask
 * Used to merge calldataBuy and calldataSell using replacementPattern as a bitmask to recreate calldata sent to sell.target
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/common/ArrayUtils.sol#L28
 */
export function guardedArrayReplace(
  _array: Bytes,
  _replacement: Bytes,
  _mask: Bytes
): Bytes {
  // If replacementPattern is empty, meaning that both arrays buyCallData == sellCallData,
  // no merging is necessary. Returns first array (buyCallData)
  if (_mask.length == 0) {
    return _array;
  }

  // Copies original Bytes Array to avoid buffer overwrite
  const array = Bytes.fromUint8Array(_array.slice(0));
  const replacement = Bytes.fromUint8Array(_replacement.slice(0));
  const mask = Bytes.fromUint8Array(_mask.slice(0));

  array.reverse();
  replacement.reverse();
  mask.reverse();

  let bigIntArray = BigInt.fromUnsignedBytes(array);
  let bigIntReplacement = BigInt.fromUnsignedBytes(replacement);
  const bigIntMask = BigInt.fromUnsignedBytes(mask);

  bigIntReplacement = bigIntReplacement.bitAnd(bigIntMask);
  bigIntArray = bigIntArray.bitOr(bigIntReplacement);
  return Bytes.fromHexString(bigIntArray.toHexString());
}

/**
 * Decode Ethereum calldata of transferFrom/safeTransferFrom calls using function signature
 * 0x23b872dd transferFrom(address,address,uint256)
 * 0x42842e0e safeTransferFrom(address,address,uint256)
 * https://www.4byte.directory/signatures/?bytes4_signature=0x23b872dd
 * https://www.4byte.directory/signatures/?bytes4_signature=0x42842e0e
 */
export function decodeERC721TransferMethod(
  target: Address,
  callData: Bytes
): DecodedTransferResult {
  const functionSelector = getFunctionSelector(callData);
  const dataWithoutFunctionSelector = Bytes.fromUint8Array(
    callData.subarray(4)
  );

  const decoded = ethereum
    .decode("(address,address,uint256)", dataWithoutFunctionSelector)!
    .toTuple();
  const senderAddress = decoded[0].toAddress();
  const recieverAddress = decoded[1].toAddress();
  const tokenId = decoded[2].toBigInt();

  return new DecodedTransferResult(
    functionSelector,
    senderAddress,
    recieverAddress,
    target,
    tokenId,
    BIGINT_ONE
  );
}

/**
 * Decode Ethereum calldata of safeTransferFrom call using function signature
 * 0xf242432a safeTransferFrom(address,address,uint256,uint256,bytes)
 * https://www.4byte.directory/signatures/?bytes4_signature=0xf242432a
 * NOTE: needs ETHABI_DECODE_PREFIX to decode (contains arbitrary bytes)
 */
export function decodeERC1155TransferResult(
  target: Address,
  callData: Bytes
): DecodedTransferResult {
  const functionSelector = getFunctionSelector(callData);
  const dataWithoutFunctionSelector = Bytes.fromUint8Array(
    callData.subarray(4)
  );
  const dataWithoutFunctionSelectorWithPrefix = ETHABI_DECODE_PREFIX.concat(
    dataWithoutFunctionSelector
  );

  const decoded = ethereum
    .decode(
      "(address,address,uint256,uint256,bytes)",
      dataWithoutFunctionSelectorWithPrefix
    )!
    .toTuple();
  const senderAddress = decoded[0].toAddress();
  const recieverAddress = decoded[1].toAddress();
  const tokenId = decoded[2].toBigInt();
  const amount = decoded[3].toBigInt();

  return new DecodedTransferResult(
    functionSelector,
    senderAddress,
    recieverAddress,
    target,
    tokenId,
    amount
  );
}

/**
 * Decode Ethereum calldata of matchERC721UsingCriteria/matchERC721WithSafeTransferUsingCriteria calls using function signature
 * 0xfb16a595 matchERC721UsingCriteria(address,address,address,uint256,bytes32,bytes32[])
 * 0xc5a0236e matchERC721WithSafeTransferUsingCriteria(address,address,address,uint256,bytes32,bytes32[])
 * https://www.4byte.directory/signatures/?bytes4_signature=0xfb16a595
 * https://www.4byte.directory/signatures/?bytes4_signature=0xc5a0236e
 * NOTE: needs ETHABI_DECODE_PREFIX to decode (contains arbitrary bytes/bytes array)
 * Ref: https://medium.com/@r2d2_68242/indexing-transaction-input-data-in-a-subgraph-6ff5c55abf20
 */
export function decodeMatchERC721UsingCriteriaResult(
  callData: Bytes
): DecodedTransferResult {
  const functionSelector = getFunctionSelector(callData);
  const dataWithoutFunctionSelector = Bytes.fromUint8Array(
    callData.subarray(4)
  );
  const dataWithoutFunctionSelectorWithPrefix = ETHABI_DECODE_PREFIX.concat(
    dataWithoutFunctionSelector
  );

  const rawDecoded = ethereum
    .decode(
      "(address,address,address,uint256,bytes32,bytes32[])",
      dataWithoutFunctionSelectorWithPrefix
    )

  const decoded = rawDecoded!.toTuple();
  const senderAddress = decoded[0].toAddress();
  const recieverAddress = decoded[1].toAddress();
  const nftContractAddress = decoded[2].toAddress();
  const tokenId = decoded[3].toBigInt();

  return new DecodedTransferResult(
    functionSelector,
    senderAddress,
    recieverAddress,
    nftContractAddress,
    tokenId,
    BIGINT_ONE
  );
}

/**
 * Decode Ethereum calldata of matchERC1155UsingCriteria call using function signature
 * 0x96809f90 matchERC1155UsingCriteria(address,address,address,uint256,uint256,bytes32,bytes32[])
 * NOTE: needs ETHABI_DECODE_PREFIX to decode calldata contains arbitrary bytes/bytes array
 */
export function decodeMatchERC1155UsingCriteriaResult(callData: Bytes): DecodedTransferResult {
  const functionSelector = getFunctionSelector(callData);
  const dataWithoutFunctionSelector = Bytes.fromUint8Array(
    callData.subarray(4)
  );
  const dataWithoutFunctionSelectorWithPrefix = ETHABI_DECODE_PREFIX.concat(
    dataWithoutFunctionSelector
  );

  const decoded = ethereum
    .decode(
      "(address,address,address,uint256,uint256,bytes32,bytes32[])",
      dataWithoutFunctionSelectorWithPrefix
    )!
    .toTuple();
  const senderAddress = decoded[0].toAddress();
  const recieverAddress = decoded[1].toAddress();
  const nftContractAddress = decoded[2].toAddress();
  const tokenId = decoded[3].toBigInt();
  const amount = decoded[4].toBigInt();

  return new DecodedTransferResult(
    functionSelector,
    senderAddress,
    recieverAddress,
    nftContractAddress,
    tokenId,
    amount
  );
}

/**
 * Decode Ethereum calldata of atomicize call using function signature
 * 0x68f0bcaa atomicize(address[],uint256[],uint256[],bytes)
 * https://www.4byte.directory/signatures/?bytes4_signature=0x68f0bcaa
 */
export function decodeAtomicizeCall(callData: Bytes): DecodedAtomicizeResult {
  const dataWithoutFunctionSelector = Bytes.fromUint8Array(
    callData.subarray(4)
  );
  const dataWithoutFunctionSelectorWithPrefix = ETHABI_DECODE_PREFIX.concat(
    dataWithoutFunctionSelector
  );
  const decoded = ethereum
    .decode(
      "(address[],uint256[],uint256[],bytes)",
      dataWithoutFunctionSelectorWithPrefix
    )!
    .toTuple();
  // target for each item
  const targets = decoded[0].toAddressArray();
  // length of calldata for each item 
  const callDataLengths = decoded[2].toBigIntArray();
  // actual calldata for each item
  const callDatas = decoded[3].toBytes();
  const atomicizedCallDatas = atomicizeCallData(callDatas, callDataLengths);

  return new DecodedAtomicizeResult(targets, atomicizedCallDatas);
}

/**
 * Determine which decoding logic we should use depending on the functionSelector.
 */
export function decodeNftTransferResult(target: Address, callData: Bytes): DecodedTransferResult {
  const functionSelector = getFunctionSelector(callData);
  if (
    functionSelector == TRANSFER_FROM_SELECTOR ||
    functionSelector == ERC721_SAFE_TRANSFER_FROM_SELECTOR
  ) {
    return decodeERC721TransferMethod(target, callData);
  } else if (
    functionSelector == MATCH_ERC721_TRANSFER_FROM_SELECTOR ||
    functionSelector == MATCH_ERC721_SAFE_TRANSFER_FROM_SELECTOR
  ) {
    return decodeMatchERC721UsingCriteriaResult(callData);
  } else if (functionSelector == ERC1155_SAFE_TRANSFER_FROM_SELECTOR) {
    return decodeERC1155TransferResult(target, callData);
  } else {
    return decodeMatchERC1155UsingCriteriaResult(callData);
  }
}

export function getOrCreateUser(addr: string): User {
  let user = User.load(addr);
  if (!user) {
    user = new User(addr);
    user.save();
  }
  return user;
}

export function getOrCreateAsset(assetID: string, tokenId: BigInt, collectionAddr: string, ownerAddr: string): Asset {
  let asset = Asset.load(assetID);
  if (!asset) {
    asset = new Asset(assetID)
    const contract = NftMetadata.bind(Address.fromString(collectionAddr));
    const nftStandard = getNftStandard(collectionAddr);
    if (nftStandard == NftStandard.ERC721) {
      // ERC721 standard [[tokenURI]] interfacec to find the URI of the NFT asset.
      // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol#L93
      const erc721TokenURIResult = contract.try_tokenURI(tokenId);
      if (!erc721TokenURIResult.reverted) {
        asset.tokenURI = erc721TokenURIResult.value;
      }
    } else if (nftStandard == NftStandard.ERC1155) {
      // ERC1155 standard [[uri]] interface to find the URI of the NFT asset.
      // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol#L59
      const erc1155TokenURIResult = contract.try_uri(tokenId);
      if (!erc1155TokenURIResult.reverted) {
        asset.tokenURI = erc1155TokenURIResult.value;
      }
    }
    asset.tokenId = tokenId;
    asset.collection = collectionAddr;
    asset.tradeCount = 0;
    asset.owner = ownerAddr;
    asset.save();
  }
  return asset;
}

export function getOrCreateCollection(collectionID: string): Collection {
  let collection = Collection.load(collectionID);
  if (!collection) {
    collection = new Collection(collectionID);

    collection.nftStandard = getNftStandard(collectionID);
    const contract = NftMetadata.bind(Address.fromString(collectionID));

    const nameResult = contract.try_name();
    if (!nameResult.reverted) {
      collection.name = nameResult.value;
    }
    const symbolResult = contract.try_symbol();
    if (!symbolResult.reverted) {
      collection.symbol = symbolResult.value;
    }
    const totalSupplyResult = contract.try_totalSupply();
    if (!totalSupplyResult.reverted) {
      collection.totalSupply = totalSupplyResult.value;
    }

    collection.royaltyFee = BIGDECIMAL_ZERO;
    collection.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
    collection.marketplaceRevenueETH = BIGDECIMAL_ZERO;
    collection.creatorRevenueETH = BIGDECIMAL_ZERO;
    collection.totalRevenueETH = BIGDECIMAL_ZERO;
    collection.tradeCount = 0;

    collection.save();
  }

  return collection;
}

/**
 * Try parse out the NFT standard from collectionID (i.e. the contract address) using ERC165 interface methods.
 */
function getNftStandard(collectionID: string): string {
  const erc165 = ERC165.bind(Address.fromString(collectionID));

  const isERC721Result = erc165.try_supportsInterface(
    Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER)
  );
  if (!isERC721Result.reverted && isERC721Result.value) {
    return NftStandard.ERC721;
  }

  const isERC1155Result = erc165.try_supportsInterface(
    Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER)
  );
  if (!isERC1155Result.reverted && isERC1155Result.value) {
    return NftStandard.ERC1155;
  }

  return NftStandard.UNKNOWN;
}

/**
 * Calculates trade/order price in BigDecimal.
 */
export function calculateTradePriceETH(call: AtomicMatch_Call, paymentToken: Address): BigDecimal {
  // NULL_ADDRESS means this is traded using ETH.
  // OpenSea techinically supports other token types, but we do not consider them for simplicity for now.
  if (paymentToken == NULL_ADDRESS) {
    // Prices returns in Wei units
    const price = calculateMatchPrice(call);
    return price.toBigDecimal().div(NUM_WEI_IN_ETH);
  } else {
    return BIGDECIMAL_ZERO;
  }
}

/**
 * Decode a single NFT transfer from calldata. If the call's functionSelector is not recognized, return null (ignored).
 */
export function decodeSingleTransferResult(target: Address, callData: Bytes): DecodedTransferResult | null {
  if (!validateCallDataFunctionSelector(callData)) {
    return null;
  } else {
    return decodeNftTransferResult(target, callData);
  }
}

/**
 * Decode a bundled NFT tranfer from calldata. Ignore any transfer if the functionSelector is not recognized.
 */
export function decodeBundleNftTransferResults(callDatas: Bytes): DecodedTransferResult[] {
  const decodedTransferResults: DecodedTransferResult[] = [];
  const decodedAtomicizeResult = decodeAtomicizeCall(callDatas);
  for (let i = 0; i < decodedAtomicizeResult.targets.length; i++) {
    const target = decodedAtomicizeResult.targets[i];
    const calldata = decodedAtomicizeResult.callDatas[i];
    const singleTransferResult = decodeSingleTransferResult(target, calldata)
    if (singleTransferResult) {
      decodedTransferResults.push(singleTransferResult);
    }
  }
  return decodedTransferResults;
}
