/**
 * Collections of simple utils for order constructions
 */

const CONSTANTS = {
    // transferFrom(address _from, address _to, uint256 _tokenId)
    TRANSFER_FROM_SELECTOR: "23b872dd",
    // MerkleValidator.matchERC721UsingCriteria(address from, address to, IERC721 token, uint256 tokenId, bytes32 root, bytes32[] proof)
    MATCH_ERC721_TRANSFER_FROM_SELECTOR: "fb16a595",

    FEE_METHOD_SPLIT: 1,
    FEE_METHOD_PROTOCOL: 0,

    // HowToCall.call
    CALL_DIRECT: 0,
    // HowToCall.delegatecall
    CALL_DELEGATE: 1,

    SALE_FIXED: 0,
    SALE_AUCTION: 1
}


/**
 * Given an integer, convert to a hex string (not 0x prefixed) padded to `size` bytes
 */
function intToPaddedHex(intValue, size = 32) {
    let hexStr = intValue.toString(16);
    const paddingLength = (size * 2) - hexStr.length;
    const paddedHexStr = '0'.repeat(paddingLength) + hexStr;
    return paddedHexStr;
}

/**
 * An all-zero hex string with `size` bytes
 */
function emptyHex(size, withPrefix = false) {
    return (withPrefix ? "0x" : "") + '0'.repeat(size * 2)
}

/**
 * An all-one hex string with `size` bytes
 */
function maxHex(size, withPrefix = false) {
    return (withPrefix ? "0x" : "") + 'f'.repeat(size * 2)
}

/**
 * Padd an address to size * bytes
 */
function paddedAddress(addr, size = 32, withPrefix = false) {
    if (addr.startsWith("0x")) addr = addr.slice(2)
    return (withPrefix ? "0x" : "") + '0'.repeat(size * 2 - addr.length) + addr
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

module.exports = {

    CONSTANTS: CONSTANTS,

    /**
     * Main util function to make an order data
     */
    makeOrder: function (
        exchangeAddr,
        nftAddr,
        seller,
        buyer,
        price, // in wei
        calldata, // create using `generateCalldata`
        {
            // If is sell side order (typically direct buy):
            // - buy.maker == sell.taker -> the buyer
            // - buy.taker == sell.maker -> the seller
            // If is buy side order (typically auction, when buyer place a bid):
            // - buy.maker == sell.taker -> the seller
            // - buy.taker == sell.maker -> the buyer
            isSellSideOrder = true,
            // (0 - call, 1 - delegated call)
            howToCall = 0,
            delegatedTarget = emptyHex(20),
            paymentToken = emptyHex(20), // 0 is ETH
            feeMethod = CONSTANTS.FEE_METHOD_SPLIT,
            buySaleKind = CONSTANTS.SALE_FIXED,
            sellSaleKind = CONSTANTS.SALE_FIXED,
            buyFeeRecipient = emptyHex(20),
            sellFeeRecipient = emptyHex(20),
            buyMakerRelayFee = 0,
            buyTakerRelayFee = 0,
            buyMakerProtocolFee = 0,
            buyTakerProtocolFee = 0,
            buyExtra = 0,
            buyListingTime = 0,
            buyExpirationTime = 0,
            sellMakerRelayFee = 0,
            sellTakerRelayFee = 0,
            sellMakerProtocolFee = 0,
            sellTakerProtocolFee = 0,
            sellExtra = 0,
            sellListingTime = 0,
            sellExpirationTime = 0
        }
    ) {

        return {
            addrs: [
                // Exchange address
                exchangeAddr,
                // buy.maker
                isSellSideOrder ? buyer : seller,
                // buy.taker
                isSellSideOrder ? seller : buyer,
                // buy.feeRecepient -> ZERO if is split fee method, otherwise need to define a recipient address to receive payment
                buyFeeRecipient,
                // buy.target -> target to call to execute the transfer
                // if is direct call, use the nft address, otherwise we delegate call to the delegatedTarget
                howToCall == 0 ? nftAddr : delegatedTarget,
                // buy.staticTarget -> typically empty
                emptyHex(20),
                // buy.paymentToken -> Zero means Ether
                paymentToken,
                // sell.exchange, same as buyer in our case, it's always OpenSea
                exchangeAddr,
                // sell.maker
                isSellSideOrder ? seller : buyer,
                // sell.taker
                isSellSideOrder ? buyer : seller,
                // sell.feeRecipient -> if ETH is used to pay relay fee, it has to be non-zero
                sellFeeRecipient,
                // sell.target -> just has to match buy.target
                howToCall == 0 ? nftAddr : delegatedTarget,
                // sell.staticTarget -> typically zero
                emptyHex(20),
                // sell.paymentToken -> Zero means Ether
                paymentToken
            ],
            uints: [
                // buy.makerRelayFee -> if buy side order is maker, charge this from buyer to buy.feeRecipient
                buyMakerRelayFee,
                // buy.takerRelayFee -> if buy side order is maker, charge this from seller to sell.feeRecipient
                buyTakerRelayFee,
                // buy.makerProtocolFee -> if buy side order is maker, charge this from buyer to buy.protocolFeeRecipient
                buyMakerProtocolFee,
                // buy.takerProtocolFee -> if buy side order is maker, charge this from seller to sell.protocolFeeRecipient
                buyTakerProtocolFee,
                // buy.basePrice in Wei
                price,
                // buy.extra -> multiplier to adjust final price based on time
                buyExtra,
                // buy.listingTime, in epoch millis
                buyListingTime,
                // buy.expirationTime, 0 means no expiration
                buyExpirationTime,
                // buy.salt - doesn't matter
                getRandomIntInclusive(0, 10000),
                // sell.makerRelayFee -> ditto, but if sell side order is maker, same for above
                sellMakerRelayFee,
                // seller.takerRelayFee
                sellTakerRelayFee,
                // seller.makerProtocolFee
                sellMakerProtocolFee,
                // seller.takerProtocolFee
                sellTakerProtocolFee,
                // seller.basePrice
                price,
                // seller.extra
                sellExtra,
                // seller.listingTime
                sellListingTime,
                // seller.expirationTime
                sellExpirationTime,
                // seller.salt - doesn't matter
                getRandomIntInclusive(0, 10000)
            ],
            feeMethodsSidesKindsHowToCalls: [
                // buy.feeMethod (0 - maker pays, 1 - split fee)
                feeMethod,
                // buy.side (0 - sell side, 1 - buy side)
                0,
                // buy.saleKind (0 - fixed price, 1 - dutch auction)
                buySaleKind,
                // buy.howToCall (0 - call, 1 - delegated call)
                howToCall,
                // sell.feeMethod (0 - maker pays, 1 - split fee), must match buy.feeMethod
                feeMethod,
                // sell.side (0 - sell side, 1 - buy side)
                1,
                // sell.saleKind (0 - fixed price, 1 - dutch auction)
                sellSaleKind,
                // sell.howToCall (0 - call, 1 - delegated call)
                howToCall,
            ],
            calldataBuy: calldata.buyCalldata,
            calldataSell: calldata.sellCalldata,
            replacementPatternBuy: calldata.buyReplacementPattern,
            replacementPatternSell: calldata.sellReplacementPattern,
            staticExtradataBuy: "0x0", // all zeros
            staticExtradataSell: "0x0", // all zeros
            // vs and rssMetadata are for Signature validation, in our dev version of OpenSea contract,
            // we've disabled validation in the smart contracts so these params don't matter that much.
            vs: [
                0, 0
            ],
            rssMetadata: [
                emptyHex(32, withPrefix = true),
                emptyHex(32, withPrefix = true),
                emptyHex(32, withPrefix = true),
                emptyHex(32, withPrefix = true),
                emptyHex(32, withPrefix = true)
            ],
            // A select set of important data
            keyData: {
                howToCall: howToCall,
                delegatedTarget: delegatedTarget,
                aggregatedCallData: calldata.aggregated
            }
        }
    },

    /**
     * Utility to generate calldata that is populated into an order.
     * @returns [buy.calldata, sell.calldata, buy.replacementPattern, sell.replacementPattern]
     */
    generateCallData: function (functionSelector, ...args) {
        if (functionSelector == CONSTANTS.TRANSFER_FROM_SELECTOR) {
            let [from, to, tokenId] = args
            if (from.startsWith("0x")) from = from.slice(2)
            if (to.startsWith("0x")) to = to.slice(2)
            return {
                buyCalldata: `0x${functionSelector}${emptyHex(32)}${paddedAddress(to)}${intToPaddedHex(tokenId)}`,
                    buyReplacementPattern: `0x${emptyHex(4)}${maxHex(32)}${emptyHex(32)}${emptyHex(32)}`,
                    sellCalldata: `0x${functionSelector}${paddedAddress(from)}${emptyHex(32)}${intToPaddedHex(tokenId)}`,
                    sellReplacementPattern: `0x${emptyHex(4)}${emptyHex(32)}${maxHex(32)}${emptyHex(32)}`
            }
        } else if (functionSelector == CONSTANTS.MATCH_ERC721_TRANSFER_FROM_SELECTOR) {
            let [from, to, token, tokenId] = args
            let root = proof = emptyHex(32)
            if (from.startsWith("0x")) from = from.slice(2)
            if (to.startsWith("0x")) to = to.slice(2)
            return {
                buyCalldata: `0x${functionSelector}${emptyHex(32)}${paddedAddress(to)}${paddedAddress(token)}${intToPaddedHex(tokenId)}${root}${proof}`,
                buyReplacementPattern: `0x${emptyHex(4)}${maxHex(32)}${emptyHex(32)}${emptyHex(32)}${emptyHex(32)}${emptyHex(32)}${emptyHex(32)}`,
                sellCalldata: `0x${functionSelector}${paddedAddress(from)}${emptyHex(32)}${paddedAddress(token)}${intToPaddedHex(tokenId)}${root}${proof}`,
                sellReplacementPattern: `0x${emptyHex(4)}${emptyHex(32)}${maxHex(32)}${emptyHex(32)}${emptyHex(32)}${emptyHex(32)}${emptyHex(32)}`,
                aggregated: `0x${functionSelector}${paddedAddress(from)}${paddedAddress(to)}${paddedAddress(token)}${intToPaddedHex(tokenId)}${root}${proof}`
            }
        } else {
            throw new Error(`Does not support function selector ${functionSelector}`)
        }
    }
}

// 0xfb16a595
// 0000000000000000000000000000000000000000000000000000000000000000
// 000000000000000000000000c78c6bb23ac77b7d19817c1c67c38675af97a5a2
// 000000000000000000000000f1005f6379f35fe681c7c458eb4f3704ead4f14a
// 000000000000000000000000000000000000000000000000000000000000041b
// 0000000000000000000000000000000000000000000000000000000000000000
// 00000000000000000000000000000000000000000000000000000000000000c0
// 0000000000000000000000000000000000000000000000000000000000000000
