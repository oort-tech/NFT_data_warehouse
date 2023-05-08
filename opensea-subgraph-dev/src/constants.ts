import {Address,
        BigDecimal,
        BigInt,
        Bytes} from "@graphprotocol/graph-ts";

export namespace NftStandard {
export const ERC721 = "ERC721";
export const ERC1155 = "ERC1155";
export const UNKNOWN = "UNKNOWN";
}

export namespace SaleKind {
export const DIRECT_PURCHASE = "DIRECT_PURCHASE";
export const AUCTION = "AUCTION";
}

export namespace Side {
export const BUY = "BUY_SIDE";
export const SELL = "SELL_SIDE";
}

// Represents native ETH when used in the paymentToken field
export const NULL_ADDRESS = Address.zero();

// The contract address that WyvernExchange invokes when there's a bundle sale.
// This address atomically executes all token transfers in an atomic way.
// https://etherscan.io/address/0xC99f70bFD82fb7c8f8191fdfbFB735606b15e5c5
export const WYVERN_ATOMICIZER_ADDRESS = Address.fromString("0xc99f70bfd82fb7c8f8191fdfbfb735606b15e5c5");

// OpenSea charges a 2.5% fee as protocol fee, which is 250 basis points.
// https://support.opensea.io/hc/en-us/articles/14068991090067-What-are-OpenSea-s-fees-#:~:text=OpenSea%20fees,the%202.5%25%20fee%20will%20apply.
export const EXCHANGE_MARKETPLACE_FEE = BigInt.fromI32(250);

// Function Selectors for ERC721/1155 Transfer Methods
// 0x23b872dd	transferFrom(address,address,uint256)
// 0x42842e0e	safeTransferFrom(address,address,uint256)
// 0xf242432a safeTransferFrom(address,address,uint256,uint256,bytes)
export const TRANSFER_FROM_SELECTOR = "0x23b872dd";
export const ERC721_SAFE_TRANSFER_FROM_SELECTOR = "0x42842e0e";
export const ERC1155_SAFE_TRANSFER_FROM_SELECTOR = "0xf242432a";

// Function Selectors for MerkleValidator Methods (0xBAf2127B49fC93CbcA6269FAdE0F7F31dF4c88a7)
// 0xfb16a595 matchERC721UsingCriteria(address,address,address,uint256,bytes32,bytes32[])
// 0xc5a0236e matchERC721WithSafeTransferUsingCriteria(address,address,address,uint256,bytes32,bytes32[])
// 0x96809f90 matchERC1155UsingCriteria(address,address,address,uint256,uint256,bytes32,bytes32[])
export const MATCH_ERC721_TRANSFER_FROM_SELECTOR = "0xfb16a595";
export const MATCH_ERC721_SAFE_TRANSFER_FROM_SELECTOR = "0xc5a0236e";
export const MATCH_ERC1155_SAFE_TRANSFER_FROM_SELECTOR = "0x96809f90";

export const ETHABI_DECODE_PREFIX = Bytes.fromHexString("0000000000000000000000000000000000000000000000000000000000000020");

// https://eips.ethereum.org/EIPS/eip-721
export const ERC721_INTERFACE_IDENTIFIER = "0x80ac58cd";
// https://eips.ethereum.org/EIPS/eip-1155#specification
export const ERC1155_INTERFACE_IDENTIFIER = "0xd9b67a26";

export const NUM_WEI_IN_ETH = BigInt.fromI32(10).pow(18).toBigDecimal();
// Defined in OpenSea WyvernExchange protocol:
// https://github.com/ProjectWyvern/wyvern-ethereum/blob/master/contracts/exchange/ExchangeCore.sol#L79
export const INVERSE_BASIS_POINT = BigDecimal.fromString("10000");

export const BIGINT_ZERO = BigInt.zero();
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGDECIMAL_ZERO = BigDecimal.zero();
export const BIGDECIMAL_HUNDRED = BigInt.fromI32(100).toBigDecimal();
export const BIGDECIMAL_MAX = BigInt.fromI32(i32.MAX_VALUE).toBigDecimal();
