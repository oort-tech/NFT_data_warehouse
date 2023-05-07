import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  log,
} from "@graphprotocol/graph-ts";
import { ERC165 } from "../generated/OpenSea/ERC165";
import { NftMetadata } from "../generated/OpenSea/NftMetadata";
import { AtomicMatch_Call } from "../generated/OpenSea/OpenSea";
import { Asset, Collection } from "../generated/schema";
import {
  NftStandard,
  BIGDECIMAL_ZERO,
  BIGDECIMAL_MAX,
  BIGINT_ZERO,
  NULL_ADDRESS,
  MANTISSA_FACTOR,
  SECONDS_PER_DAY,
  ERC721_INTERFACE_IDENTIFIER,
  ERC1155_INTERFACE_IDENTIFIER,
} from "./constants";
import {
  DecodedTransferResult,
  calculateMatchPrice,
  decode_atomicize_Method,
  decode_nftTransfer_Method,
  getFunctionSelector,
  validateCallDataFunctionSelector,
} from "./utils";

export function getOrCreateAsset(assetID: string, tokenId: BigInt, collectionAddr: string): Asset {
  let asset = Asset.load(assetID);
  if (!asset) {
    asset = new Asset(assetID)
    const contract = NftMetadata.bind(Address.fromString(collectionAddr));
    const tokenURIResult = contract.try_tokenURI(tokenId);
    if (!tokenURIResult.reverted) {
      asset.tokenURI = tokenURIResult.value;
    } else {
      asset.tokenURI = "NOT FOUND"
    }
    asset.tokenId = tokenId;
    asset.collection = collectionAddr;
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
    collection.buyerCount = 0;
    collection.sellerCount = 0;

    collection.save();
  }

  return collection;
}

function getNftStandard(collectionID: string): string {
  const erc165 = ERC165.bind(Address.fromString(collectionID));

  const isERC721Result = erc165.try_supportsInterface(
    Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER)
  );
  if (isERC721Result.reverted) {
    log.warning("[getNftStandard] isERC721 reverted, collection ID: {}", [
      collectionID,
    ]);
  } else {
    if (isERC721Result.value) {
      return NftStandard.ERC721;
    }
  }

  const isERC1155Result = erc165.try_supportsInterface(
    Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER)
  );
  if (isERC1155Result.reverted) {
    log.warning("[getNftStandard] isERC1155 reverted, collection ID: {}", [
      collectionID,
    ]);
  } else {
    if (isERC1155Result.value) {
      return NftStandard.ERC1155;
    }
  }

  return NftStandard.UNKNOWN;
}

/**
 * Calculates trade/order price in BigDecimal
 * NOTE: currently ignores non-ETH/WETH trades
 */
export function calcTradePriceETH(
  call: AtomicMatch_Call,
  paymentToken: Address
): BigDecimal {
  if (paymentToken == NULL_ADDRESS) {
    const price = calculateMatchPrice(call);
    return price.toBigDecimal().div(MANTISSA_FACTOR);
  } else {
    return BIGDECIMAL_ZERO;
  }
}

export function decodeSingleNftData(
  call: AtomicMatch_Call,
  callData: Bytes
): DecodedTransferResult | null {
  const sellTarget = call.inputs.addrs[11];
  if (!validateCallDataFunctionSelector(callData)) {
    log.warning(
      "[checkCallDataFunctionSelector] returned false, Method ID: {}, transaction hash: {}, target: {}",
      [
        getFunctionSelector(callData),
        call.transaction.hash.toHexString(),
        sellTarget.toHexString(),
      ]
    );
    return null;
  } else {
    return decode_nftTransfer_Method(sellTarget, callData);
  }
}

export function decodeBundleNftData(
  call: AtomicMatch_Call,
  callDatas: Bytes
): DecodedTransferResult[] {
  const decodedTransferResults: DecodedTransferResult[] = [];
  const decodedAtomicizeResult = decode_atomicize_Method(callDatas);
  for (let i = 0; i < decodedAtomicizeResult.targets.length; i++) {
    const target = decodedAtomicizeResult.targets[i];
    const calldata = decodedAtomicizeResult.callDatas[i];
    // Skip unrecognized method calls
    if (!validateCallDataFunctionSelector(calldata)) {
      log.warning(
        "[checkCallDataFunctionSelector] returned false in atomicize, Method ID: {}, transaction hash: {}, target: {}",
        [
          getFunctionSelector(calldata),
          call.transaction.hash.toHexString(),
          target.toHexString(),
        ]
      );
    } else {
      const singleNftTransferResult = decode_nftTransfer_Method(
        target,
        calldata
      );
      decodedTransferResults.push(singleNftTransferResult);
    }
  }
  return decodedTransferResults;
}
