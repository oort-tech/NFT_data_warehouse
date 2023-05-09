var MyContract = artifacts.require("./CustomERC721.sol");

module.exports = function(deployer) {
  deployer.deploy(MyContract);
};