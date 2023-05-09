const { makeOrder, generateCallData, CONSTANTS } = require("./utils");

// BEGIN: ORDER PARAMETERS; MODIFY THEM ACCORDINGLY
const seller = "0xc90a9b3f192fE528070Fc32d1ec1155f4F70AB29"
const buyer = "0x09dD1D0088B6934F04505cEe81b6E80e82d2c888"
// third party broker to receive protocol fees
const broker = "0xEfcE2efE40DECCcf0F763a2FB8CdB4b89Fd7f622"
// function selector to generate calldata to perform NFT transfer
const functionSelector = CONSTANTS.TRANSFER_FROM_SELECTOR
// price to trade
const price = "2090000000000000000" // in Wei, 2.09 ETH
// END: PARAMETERS

module.exports = {
    buildOrder: function (exchange, nftAddr, tokenId) {
        const order = makeOrder(
            exchange.address,
            nftAddr,
            seller,
            buyer,
            price,
            generateCallData(functionSelector, seller, buyer, tokenId), {
                isSellSideOrder: true, // direct purchase
                sellFeeRecipient: broker
            }
        )

        console.log(order)

        return order;
    },

    executeOrder: async function (exchange, order) {
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
}

/*
const exchange = await WyvernExchange.deployed();
const { buildOrder, executeOrder } = require("./orders/SimpleNft_1.js")

var order = buildOrder(exchange, "$NFT_ADDR", "$TOKEN_ID")
executeOrder(exchange, order)
*/
