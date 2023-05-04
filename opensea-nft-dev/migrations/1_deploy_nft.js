const SimpleNFT = artifacts.require("SimpleNFT");

module.exports = function (deployer) {
    deployer.deploy(SimpleNFT);
};
