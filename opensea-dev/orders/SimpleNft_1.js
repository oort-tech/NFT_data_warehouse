const { makeOrder, generateCallData, CONSTANTS } = require("./utils");

// BEGIN: ORDER PARAMETERS; MODIFY THEM ACCORDINGLY
// maker == seller
const maker = "0xc90a9b3f192fE528070Fc32d1ec1155f4F70AB29"
// taker == buyer
const taker = "0xc90a9b3f192fE528070Fc32d1ec1155f4F70AB29"
// third party broker to receive transaction fees
const broker = "0xEfcE2efE40DECCcf0F763a2FB8CdB4b89Fd7f622"
// function selector to generate calldata to perform NFT transfer
const functionSelector = CONSTANTS.TRANSFER_FROM_BYTE_CODE
// price to trade
const price = "2090000000000000000" // in Wei, 2.09 ETH
// END: PARAMETERS

/**
 * Main interface for creating an order
 * @param exchange The deployed WyvernExchange object
 * @param nftAddr Address of the NFT protocol
 */
module.exports = async function(exchange, nftAddr, tokenId) {
    const order = makeOrder(
        exchange.address,
        nftAddr,
        maker,
        taker,
        price,
        generateCallData(functionSelector, maker, taker, tokenId),
        {
            sellFeeRecipient: broker
        }
    )

    console.log(order)

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
        order.rssMetadata, {
            value: price // ETH to send as `msg.value`
        }
    )

    console.log(result)
}

// const nft = await SimpleNft.deployed()

// const exchange = await WyvernExchange.deployed()
// await require("./orders/SimpleNft_1.js")(exchange, "0x025e230b2e94B89c8bC0b1e9E6E416BDd36ce5D7", 0)
