import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";

import {ERC165} from "../generated/OpenSea/ERC165";
import {NftMetadata} from "../generated/OpenSea/NftMetadata";
import {AtomicMatch_Call} from "../generated/OpenSea/OpenSea";
import {Asset,
        Collection,
        User} from "../generated/schema";

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
  NftStandard,
  NULL_ADDRESS,
  NUM_WEI_IN_ETH,
  SaleKind,
  Side,
  TRANSFER_FROM_SELECTOR,
} from "./constants";

export class DecodedCallDataResult {
  constructor(
      public readonly functionSelector: string,
      public readonly from: Address,
      public readonly to: Address,
      public readonly token: Address,
      public readonly tokenId: BigInt,
      public readonly amount: BigInt) {}
}

export class DecodedAtomicCallDataResult {
  constructor(
      public readonly targets: Address[],
      public readonly callDatas: Bytes[]) {}
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
  return side == 0 ? Side.BUY : Side.SELL;
}

/**
 * Get salekind, either DIRECT_PURCHASE or AUCTION
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/SaleKindInterface.sol#L29
 */
export function getSaleKind(saleKind: i32): string {
  return saleKind == 0 ? SaleKind.DIRECT_PURCHASE : SaleKind.AUCTION;
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
      functionSelector == MATCH_ERC1155_SAFE_TRANSFER_FROM_SELECTOR);
}

/**
 * Creates a list of calldatas which can be decoded in decodeSingleNftData
 */
export function splitAtomicizeCallDatas(
    callDatas: Bytes,
    callDataLengths: BigInt[]): Bytes[] {
  const atomicizedCallData: Bytes[] = [];
  let index = 0;
  for (let i = 0; i < callDataLengths.length; i++) {
    const length = callDataLengths[i].toI32();
    const callData = Bytes.fromUint8Array(callDatas.subarray(index, index + length));
    atomicizedCallData.push(callData);
    index += length;
  }
  return atomicizedCallData;
}

/**
 * Calculate the prices the buy-side/sell-side orders match at.
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
      call.block.timestamp);

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
      call.block.timestamp);

  // If is sell-side order, use the sell price (i.e. use the user's listing price),
  // otherwise is buy-side order (i.e. auction), then we use the final buy bid price
  return sellSideFeeRecipient.notEqual(NULL_ADDRESS) ? sellPrice : buyPrice;
}

/**
 * Compute final price based on if this is an auction if just a plain direct sale.
 * References:
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/master/contracts/exchange/ExchangeCore.sol#L460
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/SaleKindInterface.sol#L70
 */
export function calculateFinalPrice(
    side: i32,
    saleKind: i32,
    basePrice: BigInt,
    extra: BigInt,
    listingTime: BigInt,
    expirationTime: BigInt,
    now: BigInt): BigInt {
  if (getSaleKind(saleKind) == SaleKind.DIRECT_PURCHASE)
    return basePrice;
  else if (getSaleKind(saleKind) == SaleKind.AUCTION) {
    const diff = extra.times(now.minus(listingTime)).div(expirationTime.minus(listingTime));
    return getOrderSide(side) == Side.SELL ? basePrice.minus(diff) : basePrice.plus(diff);
  } else
    return BIGINT_ZERO;
}

/**
 * Replace bytes in an array with bytes in another array, guarded by a bitmask
 * Used to merge calldataBuy and calldataSell using replacementPattern as a bitmask to recreate calldata sent to sell.target
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/common/ArrayUtils.sol#L28
 */
export function guardedArrayReplace(
    _array: Bytes,
    _replacement: Bytes,
    _mask: Bytes): Bytes {
  // If replacementPattern is empty, meaning that both arrays buyCallData == sellCallData,
  // no merging is necessary. Returns first array (buyCallData)
  if (_mask.length == 0)
    return _array;

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
 * Decode calldata of transferFrom/safeTransferFrom calls using function selector
 * 0x23b872dd transferFrom(address,address,uint256)
 * 0x42842e0e safeTransferFrom(address,address,uint256)
 */
export function decodeERC721CallData(
    target: Address,
    callData: Bytes): DecodedCallDataResult {
  const functionSelector = getFunctionSelector(callData);
  const data = Bytes.fromUint8Array(callData.subarray(4));

  const decoded = ethereum.decode("(address,address,uint256)", data)!.toTuple();
  const senderAddress = decoded[0].toAddress();
  const recieverAddress = decoded[1].toAddress();
  const tokenId = decoded[2].toBigInt();

  return new DecodedCallDataResult(functionSelector, senderAddress, recieverAddress, target, tokenId, BIGINT_ONE);
}

/**
 * Decode calldata of matchERC721UsingCriteria/matchERC721WithSafeTransferUsingCriteria calls using function selector
 * 0xfb16a595 matchERC721UsingCriteria(address,address,address,uint256,bytes32,bytes32[])
 * 0xc5a0236e matchERC721WithSafeTransferUsingCriteria(address,address,address,uint256,bytes32,bytes32[])
 * NOTE: needs ETHABI_DECODE_PREFIX to decode (contains arbitrary bytes/bytes array)
 * Ref: https://medium.com/@r2d2_68242/indexing-transaction-input-data-in-a-subgraph-6ff5c55abf20
 */
export function decodeMatchERC721MatchUsingCriteria(callData: Bytes): DecodedCallDataResult {
  const functionSelector = getFunctionSelector(callData);
  const data = Bytes.fromUint8Array(callData.subarray(4));
  const prefixedData = ETHABI_DECODE_PREFIX.concat(data);
  const rawDecoded = ethereum.decode("(address,address,address,uint256,bytes32,bytes32[])", prefixedData);

  const decoded = rawDecoded!.toTuple();
  const senderAddress = decoded[0].toAddress();
  const recieverAddress = decoded[1].toAddress();
  const nftContractAddress = decoded[2].toAddress();
  const tokenId = decoded[3].toBigInt();

  return new DecodedCallDataResult(functionSelector, senderAddress, recieverAddress, nftContractAddress, tokenId, BIGINT_ONE);
}

/**
 * Decode calldata of safeTransferFrom call using function selector
 * 0xf242432a safeTransferFrom(address,address,uint256,uint256,bytes)
 */
export function decodeERC1155CallData(target: Address, callData: Bytes): DecodedCallDataResult {
  const functionSelector = getFunctionSelector(callData);
  const data = Bytes.fromUint8Array(callData.subarray(4));
  const prefixedData = ETHABI_DECODE_PREFIX.concat(data);

  const decoded = ethereum.decode("(address,address,uint256,uint256,bytes)", prefixedData)!.toTuple();
  const senderAddress = decoded[0].toAddress();
  const recieverAddress = decoded[1].toAddress();
  const tokenId = decoded[2].toBigInt();
  const amount = decoded[3].toBigInt();

  return new DecodedCallDataResult(functionSelector, senderAddress, recieverAddress, target, tokenId, amount);
}

/**
 * Decode calldata of matchERC1155UsingCriteria call using function selector
 * 0x96809f90 matchERC1155UsingCriteria(address,address,address,uint256,uint256,bytes32,bytes32[])
 */
export function decodeMatchERC1155MatchUsingCriteria(callData: Bytes): DecodedCallDataResult {
  const functionSelector = getFunctionSelector(callData);
  const data = Bytes.fromUint8Array(callData.subarray(4));
  const prefixedData = ETHABI_DECODE_PREFIX.concat(data);

  const decoded = ethereum.decode("(address,address,address,uint256,uint256,bytes32,bytes32[])", prefixedData)!.toTuple();
  const senderAddress = decoded[0].toAddress();
  const recieverAddress = decoded[1].toAddress();
  const nftContractAddress = decoded[2].toAddress();
  const tokenId = decoded[3].toBigInt();
  const amount = decoded[4].toBigInt();

  return new DecodedCallDataResult(functionSelector, senderAddress, recieverAddress, nftContractAddress, tokenId, amount);
}

/**
 * Decode calldata of atomicize call using function selector
 * 0x68f0bcaa atomicize(address[],uint256[],uint256[],bytes)
 */
export function decodeAtomicizeCall(callData: Bytes): DecodedAtomicCallDataResult {
  const cleanData = Bytes.fromUint8Array(callData.subarray(4));
  const prefixedData = ETHABI_DECODE_PREFIX.concat(cleanData);
  const decoded = ethereum.decode("(address[],uint256[],uint256[],bytes)", prefixedData)!.toTuple();
  // target for each item
  const targets = decoded[0].toAddressArray();
  // length of calldata for each item
  const callDataLengths = decoded[2].toBigIntArray();
  // actual calldata for each item
  const callDatas = decoded[3].toBytes();
  const atomicizedCallDatas = splitAtomicizeCallDatas(callDatas, callDataLengths);

  return new DecodedAtomicCallDataResult(targets, atomicizedCallDatas);
}

/**
 * Determine which decoding logic we should use depending on the functionSelector.
 */
export function decodeNftTransferResult(target: Address, callData: Bytes): DecodedCallDataResult {
  const functionSelector = getFunctionSelector(callData);
  if (functionSelector == TRANSFER_FROM_SELECTOR || functionSelector == ERC721_SAFE_TRANSFER_FROM_SELECTOR) {
    return decodeERC721CallData(target, callData);
  } else if (functionSelector == MATCH_ERC721_TRANSFER_FROM_SELECTOR || functionSelector == MATCH_ERC721_SAFE_TRANSFER_FROM_SELECTOR) {
    return decodeMatchERC721MatchUsingCriteria(callData);
  } else if (functionSelector == ERC1155_SAFE_TRANSFER_FROM_SELECTOR) {
    return decodeERC1155CallData(target, callData); 
  } else {
    return decodeMatchERC1155MatchUsingCriteria(callData);
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
    const nftStandard = getNftProtocolStandard(collectionAddr);
    if (nftStandard == NftStandard.ERC721) {
      // ERC721 standard [[tokenURI]] interfacec to find the URI of the NFT asset.
      // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol#L93
      const erc721TokenURIResult = contract.try_tokenURI(tokenId);
      if (!erc721TokenURIResult.reverted)
        asset.tokenURI = erc721TokenURIResult.value;
    } else if (nftStandard == NftStandard.ERC1155) {
      // ERC1155 standard [[uri]] interface to find the URI of the NFT asset.
      // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol#L59
      const erc1155TokenURIResult = contract.try_uri(tokenId);
      if (!erc1155TokenURIResult.reverted)
        asset.tokenURI = erc1155TokenURIResult.value;
    }
    asset.tokenId = tokenId;
    asset.owner = ownerAddr;
    asset.collection = collectionAddr;
    asset.tradeCount = 0;
    asset.save();
  }
  return asset;
}

export function getOrCreateCollection(collectionID: string): Collection {
  let collection = Collection.load(collectionID);
  if (!collection) {
    collection = new Collection(collectionID);
    collection.nftStandard = getNftProtocolStandard(collectionID);
    const contract = NftMetadata.bind(Address.fromString(collectionID));
    if (!contract.try_name().reverted)
      collection.name = contract.try_name().value;
    if (!contract.try_symbol().reverted)
      collection.symbol = contract.try_symbol().value;
    if (!contract.try_totalSupply().reverted)
      collection.totalSupply = contract.try_totalSupply().value;

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
function getNftProtocolStandard(collectionID: string): string {
  const erc165 = ERC165.bind(Address.fromString(collectionID));
  const isERC721Result = erc165.try_supportsInterface(Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER));
  if (!isERC721Result.reverted && isERC721Result.value)
    return NftStandard.ERC721;
  const isERC1155Result = erc165.try_supportsInterface(Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER));
  if (!isERC1155Result.reverted && isERC1155Result.value)
    return NftStandard.ERC1155;
  return NftStandard.UNKNOWN;
}

/**
 * Calculates trade/order price in BigDecimal.
 */
export function calculateTradePriceInETH(call: AtomicMatch_Call, paymentToken: Address): BigDecimal {
  // NULL_ADDRESS means this is traded using ETH.
  // OpenSea techinically supports other token types, but we do not consider them for simplicity for now.
  return paymentToken == NULL_ADDRESS ? calculateMatchPrice(call).toBigDecimal().div(NUM_WEI_IN_ETH) : BIGDECIMAL_ZERO;
}

/**
 * Decode a single NFT transfer from calldata. If the call's functionSelector is not recognized, return null (ignored).
 */
export function decodeSingleNftCallData(target: Address, callData: Bytes): DecodedCallDataResult|null {
  return validateCallDataFunctionSelector(callData) ? decodeNftTransferResult(target, callData) : null;
}

/**
 * Decode a bundled NFT tranfer from calldata. Ignore any transfer if the functionSelector is not recognized.
 */
export function decodeBundleNftCallData(callDatas: Bytes): DecodedCallDataResult[] {
  const decodedTransferResults: DecodedCallDataResult[] = [];
  const decodedAtomicizeResult = decodeAtomicizeCall(callDatas);
  for (let i = 0; i < decodedAtomicizeResult.targets.length; i++) {
    const target = decodedAtomicizeResult.targets[i];
    const calldata = decodedAtomicizeResult.callDatas[i];
    const singleTransferResult = decodeSingleNftCallData(target, calldata)
    if (singleTransferResult) decodedTransferResults.push(singleTransferResult);
  }
  return decodedTransferResults;
}
