const ZERO_20 = "0x0000000000000000000000000000000000000000"
const ZERO_32 = "0x0000000000000000000000000000000000000000000000000000000000000000"
const MAX_32 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        
const ZERO_12 = "0x000000000000000000000000"
const ZERO_4 = "0x00000000"

// WyvernExchange address
const exchangeAddress = "0xfB95965fecB2A91d4D0F118E8ACCfB40C9DE60E7"
const nftAddr = "0x1429Cec35d0FbcD73172644Ed0E1b73E5C929962"

// Buyer and seller
const maker = "0xc90a9b3f192fE528070Fc32d1ec1155f4F70AB29"
const taker = "0xc90a9b3f192fE528070Fc32d1ec1155f4F70AB29"

// Random uints
const randomUint1 = 1234
const randomUint2 = 2234

// Misc params
const functionSelector = "0x23b872dd" // transferFrom(address _from, address _to, uint256 _tokenId)

const tokenId = 0

const price = "2090000000000000000"

function intToPaddedHex(intValue, size = 32) {
    // Convert the integer to a hex string
    let hexStr = intValue.toString(16);

    // Calculate the padding length
    const paddingLength = (size * 2) - hexStr.length;

    // Pad the hex string with zeros
    const paddedHexStr = '0'.repeat(paddingLength) + hexStr;

    return paddedHexStr;
}

const order = {
    addrs: [
        // Exchange address
        exchangeAddress,
        // buy.maker - maker of the NFT
        maker,
        // buy.taker
        taker,
        // buy.feeRecepient
        ZERO_20,
        // buy.target -> calling NFT directly
        nftAddr,
        // buy.staticTarget,
        ZERO_20,
        // buy.paymentToken -> Zero means Ether
        ZERO_20,
        // sell.exchange
        exchangeAddress,
        // sell.maker
        taker,
        // sell.taker
        ZERO_20,
        // sell.feeRecipient
        maker,
        // sell.target
        nftAddr,
        // sell.staticTarget
        ZERO_20,
        // sell.paymentToken -> Zero means Ether
        ZERO_20
    ],
    uints: [
        // buy.makerRelayFee
        0,
        // buy.takerRelayFee
        0,
        // buy.makerProtocolFee
        0,
        // buy.takerProtocolFee
        0,
        // buy.basePrice in Wei
        price,
        // buy.extra
        0,
        // buy.listingTime, in epoch millis
        0,
        // buy.expirationTime, 0 means no expiration
        0,
        // buy.salt
        randomUint1,
        // sell.makerRelayFee
        0,
        // seller.takerRelayFee
        0,
        // seller.makerProtocolFee
        0,
        // seller.takerProtocolFee
        0,
        // seller.basePrice
        price,
        // seller.extra
        0, 
        // seller.listingTime
        0,
        // seller.expirationTime
        0,
        // seller.salt
        randomUint2
    ],
    feeMethodsSidesKindsHowToCalls: [
        // buy.feeMethod (0 - split fee, 1 - maker pays)
        1,
        // buy.side (0 - sell side, 1 - buy side)
        0,
        // buy.saleKind (0 - fixed price, 1 - dutch auction)
        0,
        // buy.howToCall (0 - call, 1 - delegated call)
        // TODO: not sure about this
        1,
        // sell.feeMethod (0 - split fee, 1 - maker pays)
        1,
        // sell.side (0 - sell side, 1 - buy side)
        1,
        // sell.saleKind (0 - fixed price, 1 - dutch auction)
        0,
        // sell.howToCall (0 - call, 1 - delegated call)
        1,
    ],
    calldataBuy: `0x${functionSelector.slice(2)}${ZERO_12.slice(2)}${ZERO_32.slice(2)}${maker.slice(2)}${ZERO_12.slice(2)}${nftAddr.slice(2)}${intToPaddedHex(tokenId)}`,
    calldataSell: `0x${functionSelector.slice(2)}${ZERO_12.slice(2)}${taker.slice(2)}${ZERO_12.slice(2)}${ZERO_32.slice(2)}${nftAddr.slice(2)}${intToPaddedHex(tokenId)}`,
    replacementPatternBuy: `0x${ZERO_4.slice(2)}${MAX_32.slice(2)}${ZERO_32.slice(2)}${ZERO_32.slice(2)}${ZERO_32.slice(2)}`,
    replacementPatternSell: `0x${ZERO_4.slice(2)}${ZERO_32.slice(2)}${MAX_32.slice(2)}${ZERO_32.slice(2)}${ZERO_32.slice(2)}`,
    staticExtradataBuy: "0x0", // all zeros
    staticExtradataSell: "0x0", // all zeros
    // vs and rssMetadata are for Signature validation, in our dev version of OpenSea contract,
    // we've disabled validation so these params don't matter that much.
    vs: [
        0, 0
    ],
    rssMetadata: [
        ZERO_32,
        ZERO_32,
        ZERO_32,
        ZERO_32,
        ZERO_32
    ]
}

module.exports = async function(exchange) {
    const result = await exchange.atomicMatch_(
        order.addrs,
        order.uints,
        order.feeMethodsSidesKindsHowToCalls,
        order.calldataBuy,
        order.calldataSell,
        order.replacementPatternBuy,
        order.replacementPatternSell,
        order.staticExtradataBuy,
        order.staticExtradataSell,
        order.vs,
        order.rssMetadata,
        { value : price }
    )
    console.log(result)
}

// await require("./orders/SimpleNft_1.js")(await WyvernExchange.deployed())
