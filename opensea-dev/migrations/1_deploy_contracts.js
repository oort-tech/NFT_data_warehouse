const MerkleValidator = artifacts.require("MerkleValidator")
const WyvernProxyRegistry = artifacts.require("WyvernProxyRegistry")
const WyvernTokenTransferProxy = artifacts.require("WyvernTokenTransferProxy")
const EveryOneIsRichWyvernToken = artifacts.require("EveryOneIsRichWyvernToken")
const WyvernExchange = artifacts.require("WyvernExchange");

// A preset account in `private_chain.json` with 0 balance
const protocolFeeRecipient = "0xEfcE2efE40DECCcf0F763a2FB8CdB4b89Fd7f622"

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(MerkleValidator)
    await deployer.deploy(WyvernProxyRegistry)
    await deployer.deploy(WyvernTokenTransferProxy, WyvernProxyRegistry.address)
    await deployer.deploy(EveryOneIsRichWyvernToken)
    await deployer.deploy(WyvernExchange, WyvernProxyRegistry.address, WyvernTokenTransferProxy.address, EveryOneIsRichWyvernToken.address, protocolFeeRecipient);
}
