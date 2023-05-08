const ConvertLib = artifacts.require("ConvertLib");
const MetaCoin = artifacts.require("MetaCoin");
const NFT = artifacts.require("./NFTMarketplace.sol");

module.exports = function(deployer) {
  deployer.deploy(NFT);
};
