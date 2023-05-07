const {
    makeOrder,
    generateCallData,
    CONSTANTS
} = require("./utils");

// BEGIN: ORDER PARAMETERS; MODIFY THEM ACCORDINGLY
const seller = "0xc90a9b3f192fE528070Fc32d1ec1155f4F70AB29"
const buyer = "0x09dD1D0088B6934F04505cEe81b6E80e82d2c888"
// third party broker to receive protocol fees
const broker = "0xEfcE2efE40DECCcf0F763a2FB8CdB4b89Fd7f622"
// function selector to generate calldata to perform NFT transfer
const functionSelector = CONSTANTS.MATCH_ERC721_TRANSFER_FROM_SELECTOR
// price to trade
const price = "2090000000000000000" // in Wei, 2.09 ETH
// END: PARAMETERS

/**
 * Create a Simple NFT order with MerkleValidator as target
 * @param exchange The deployed WyvernExchange object
 * @param merkle Address of the MerkleValidator
 * @param nftAddr Address of the NFT protocol
 */
module.exports = {
    buildOrder: function (exchange, merkle, nftAddr, tokenId) {
        const order = makeOrder(
            exchange.address,
            nftAddr,
            seller,
            buyer,
            price,
            generateCallData(functionSelector, seller, buyer, nftAddr, tokenId), {
                isSellSideOrder: true, // direct purchase
                sellFeeRecipient: broker,
                howToCall: 1, // delegated call
                delegatedTarget: merkle.address // calls MerkleValidator
            }
        )

        console.log(order)

        return order;
    },

    executeOrder: async function (exchange, order) {
        // FIXME: needs to disable calling Merkle target from within the contract
        var disabled = await exchange.disableCallTarget()
        if (!disabled) {
            await exchange.toggleDisableCallTarget();
        }

        const matchResult = await exchange.atomicMatch_(
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
                value: price, // ETH to send as `msg.value`,
            }
        )
        console.log(matchResult)

        // FIXME: for some reason we need to use another `proxyCall` to finalize the transfer
        const itemTransferResult = await exchange.proxyCall(order.keyData.delegatedTarget, order.keyData.howToCall, order.keyData.aggregatedCallData)

        console.log(itemTransferResult)

        // FIXME: re-enabling it.
        await exchange.toggleDisableCallTarget();
    }
}

/*
const exchange = await WyvernExchange.deployed();
const merkle = await MerkleValidator.deployed();
const { buildOrder, executeOrder } = require("./orders/SimpleNft_2.js");

var order = buildOrder(exchange, merkle, "$NFT_ADDR", "$TOKEN_ID")
executeOrder(exchange, order)
*/


