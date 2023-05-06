const SimpleNFT = artifacts.require("SimpleNFT");

module.exports = async function (deployer) {
    await deployer.deploy(SimpleNFT);
};
