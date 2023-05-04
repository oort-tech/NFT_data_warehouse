const WyvernProxyRegistry = artifacts.require("WyvernProxyRegistry")
const WyvernTokenTransferProxy = artifacts.require("WyvernTokenTransferProxy")
const WyvernToken = artifacts.require("WyvernToken")
const WyvernDAOProxy = artifacts.require("WyvernDAOProxy")
const WyvernExchange = artifacts.require("WyvernExchange");

module.exports = async function (deployer, network, accounts) {
    const dummyMerkleRoot = "0xbfdda2cdd0ddffbde454c05ba311161075f0baa7ee43681b8cd44669883ba445"
    const dummyTotalUtxoAmount = "185976814178002"

    await deployer.deploy(WyvernProxyRegistry)
    await deployer.deploy(WyvernTokenTransferProxy, WyvernProxyRegistry.address)
    await deployer.deploy(WyvernToken, dummyMerkleRoot, dummyTotalUtxoAmount)
    await deployer.deploy(WyvernDAOProxy)
    await deployer.deploy(WyvernExchange, WyvernProxyRegistry.address, WyvernTokenTransferProxy.address, WyvernToken.address, WyvernDAOProxy.address);
}
