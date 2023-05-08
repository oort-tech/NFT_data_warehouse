contract("NFTMarketplace", function(accounts) {
    it("should prevent non-owners from removing an NFT from sale", async function() {
      const nftMarketplace = await NFTMarketplace.deployed();
      
      // Create a new NFT and list it for sale
      const nftId = 1;
      const nftPrice = web3.utils.toWei("1", "ether");
      await nftMarketplace.createNFT(nftId, "My NFT", "This is my NFT");
      await nftMarketplace.listNFTForSale(nftId, nftPrice, {from: accounts[0]});
      
      // Attempt to remove the NFT from sale as a non-owner
      try {
        await nftMarketplace.removeNFTFromSale(nftId, {from: accounts[1]});
        assert.fail("Expected revert not received");
      } catch (error) {
        assert(error.message.includes("revert"), "Expected revert");
      }
      
      // Assert that the NFT is still listed for sale
      const nft = await nftMarketplace.getNFT(nftId);
      assert.equal(nft.forSale, true, "NFT should still be listed for sale");
    });
  });
  