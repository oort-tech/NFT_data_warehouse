/**
 * Collections of simple utils for order constructions
 */

const CONSTANTS = {
    // transferFrom(address _from, address _to, uint256 _tokenId)
    TRANSFER_FROM_BYTE_CODE: "23b872dd",

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

module.exports = {

    CONSTANTS: CONSTANTS,

    /**
     * Main util function to make an order data
     */
    makeOrder: function (
        exchangeAddr,
        nftAddr,
        maker,
        taker,
        price, // in wei
        calldata, // create using `generateCalldata`
        {
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
                // buy.maker -> seller of the NFT
                maker,
                // buy.taker -> buyer of the NFT
                taker,
                // buy.feeRecepient -> ZERO if is split fee method, otherwise need to define a recipient address to receive payment
                buyFeeRecipient,
                // buy.target -> target to call to execute the transfer, we just use nftAddr in all cases to simplify, we removed MerkleValidator in our dev contract
                nftAddr,
                // buy.staticTarget -> typically empty
                emptyHex(20),
                // buy.paymentToken -> Zero means Ether
                paymentToken,
                // sell.exchange, same as buyer in our case, it's always OpenSea
                exchangeAddr,
                // sell.maker -> buyer of the NFT
                taker,
                // sell.taker -> typically empty
                emptyHex(20),
                // sell.feeRecipient -> if ETH is used to pay relay fee, it has to be non-zero
                sellFeeRecipient,
                // sell.target -> just has to match buy.target
                nftAddr,
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
                1234,
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
                4321
            ],
            feeMethodsSidesKindsHowToCalls: [
                // buy.feeMethod (0 - maker pays, 1 - split fee)
                feeMethod,
                // buy.side (0 - sell side, 1 - buy side)
                0,
                // buy.saleKind (0 - fixed price, 1 - dutch auction)
                buySaleKind,
                // buy.howToCall (0 - call, 1 - delegated call)
                // Use direct call because we are calling the NFT directly, we don't support MerkleValidator as immediary proxy.
                0,
                // sell.feeMethod (0 - maker pays, 1 - split fee), must match buy.feeMethod
                feeMethod,
                // sell.side (0 - sell side, 1 - buy side)
                1,
                // sell.saleKind (0 - fixed price, 1 - dutch auction)
                sellSaleKind,
                // sell.howToCall (0 - call, 1 - delegated call)
                0,
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
            ]
        }
    },

    /**
     * Utility to generate calldata that is populated into an order.
     * @returns [buy.calldata, sell.calldata, buy.replacementPattern, sell.replacementPattern]
     */
    generateCallData: function (functionSelector, ...args) {
        switch (functionSelector) {
            case CONSTANTS.TRANSFER_FROM_BYTE_CODE:
                let [maker, taker, tokenId] = args
                if (maker.startsWith("0x")) maker = maker.slice(2)
                if (taker.startsWith("0x")) taker = taker.slice(2)
                return {
                    buyCalldata: `0x${functionSelector}${emptyHex(32)}${emptyHex(12)}${maker}${intToPaddedHex(tokenId)}`,
                        buyReplacementPattern: `0x${emptyHex(4)}${maxHex(32)}${emptyHex(32)}${emptyHex(32)}`,
                        sellCalldata: `0x${functionSelector}${emptyHex(12)}${taker}${emptyHex(32)}${intToPaddedHex(tokenId)}`,
                        sellReplacementPattern: `0x${emptyHex(4)}${emptyHex(32)}${maxHex(32)}${emptyHex(32)}`
                }

                default:
                    throw new Error(`Does not support function selector ${functionSelector}`)
        }
    }
}
