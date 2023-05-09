const NFTMarketplace = artifacts.require('NFTMarketplace');

module.exports = async function(deployer) {
    await deployer.deploy(NFTMarketplace);

  };
  