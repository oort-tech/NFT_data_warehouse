const CustomERC721 = artifacts.require("CustomERC721");

contract("CustomERC721", (accounts) => {
    let customERC721;
    const creator = accounts[0];

    beforeEach(async () => {
        customERC721 = await CustomERC721.new();
    });

    it("should create a new NFT with the correct properties", async () => {
        const tokenId = 1;
        const name = "NFT Name";
        const description = "NFT Description";
        const expectedTokenURI = "data:application/json;base64," + name + "," + description;

        // Call the createNFT function with a unique ID, name, and description
        await customERC721.createNFT(tokenId, name, description, { from: creator });

        // Assert that the NFT was created and its properties match the input values
        const owner = await customERC721.ownerOf(tokenId);
        const tokenURI = await customERC721.tokenURI(tokenId);

        assert.equal(owner, creator, "The creator should be the owner of the NFT.");
        assert.equal(tokenURI, expectedTokenURI, "TokenURI does not match the expected value");
    });

    it("should transfer ownership of an NFT", async () => {
        const tokenId = 2;
        const name = "NFT Name 2";
        const description = "NFT Description 2";
        const firstUser = accounts[1];
        const secondUser = accounts[2];

        // Create a new NFT with the first user account
        await customERC721.createNFT(tokenId, name, description, { from: firstUser });

        // Transfer ownership of the NFT to the second user account using the transferNFT function
        await customERC721.transferNFT(secondUser, tokenId, { from: firstUser });

        // Assert that the NFT is now owned by the second user account
        const newOwner = await customERC721.ownerOf(tokenId);
        assert.equal(newOwner, secondUser, "Ownership of the NFT should have been transferred to the second user.");
    });

    it("should list an NFT for sale", async () => {
        const tokenId = 3;
        const name = "NFT Name 3";
        const description = "NFT Description 3";
        const user = accounts[3];
        const salePrice = web3.utils.toWei("1", "ether");

        // Create a new user account and a new NFT with the user account
        await customERC721.createNFT(tokenId, name, description, { from: user });

        // List the NFT for sale using the listNFTForSale function with a sale price
        await customERC721.listNFTForSale(tokenId, salePrice, { from: user });

        // Assert that the NFT is now listed for sale and its sale price matches the input value
        const isOnSale = await customERC721.isTokenOnSale(tokenId);
        const listedPrice = await customERC721.getTokenPrice(tokenId);

        assert.isTrue(isOnSale, "The NFT should be listed for sale.");
        assert.equal(listedPrice, salePrice, "The sale price should match the input value.");
    });

    it("should remove an NFT from sale", async () => {
        const tokenId = 4;
        const name = "NFT Name 4";
        const description = "NFT Description 4";
        const user = accounts[4];
        const salePrice = web3.utils.toWei("1", "ether");

        // Create a new user account and a new NFT with the user account
        await customERC721.createNFT(tokenId, name, description, { from: user });

        // List the NFT for sale using the listNFTForSale function with a sale price
        await customERC721.listNFTForSale(tokenId, salePrice, { from: user });

        // Remove the NFT from sale using the removeNFTFromSale function
        await customERC721.removeNFTFromSale(tokenId, { from: user });

        // Assert that the NFT is no longer listed for sale
        const isOnSale = await customERC721.isTokenOnSale(tokenId);

        assert.isFalse(isOnSale, "The NFT should no longer be listed for sale.");
    });

    it("should execute a successful or unsuccessful NFT purchase", async () => {
        const tokenId = 5;
        const name = "NFT Name 5";
        const description = "NFT Description 5";
        const seller = accounts[1];
        const buyer = accounts[2];
        const salePrice = web3.utils.toWei("1", "ether");
      
        // Create a new NFT with the first user account
        await customERC721.createNFT(tokenId, name, description, { from: seller });
      
        // List the NFT for sale using the listNFTForSale function with a sale price
        await customERC721.listNFTForSale(tokenId, salePrice, { from: seller });
      
        // Get initial balances of both seller and buyer
        const initialSellerBalance = await web3.eth.getBalance(seller);
        const initialBuyerBalance = await web3.eth.getBalance(buyer);
        
        // Get input from user for purchase price
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Get input from user for purchase price
        const purchasePrice = await new Promise((resolve) => {
            readline.question(`Enter purchase price in Ether (given an NFT listed for sale = 1ETH; correct: > 1 ETH; incorrect: otherwise): `, (price) => {
              resolve(web3.utils.toWei(price, "ether"));
              readline.close();
            });
        });
        
        // Check if purchase price is greater than or equal to sale price
        if (web3.utils.toBN(purchasePrice).gte(web3.utils.toBN(salePrice))) {
          // Purchase the NFT using the purchaseNFT function with the second user
          // account and the correct amount of Ether
          
          await customERC721.purchaseNFT(tokenId, { from: buyer, value: purchasePrice });
      
          // Assert that the NFT is now owned by the second user account
          const newOwner = await customERC721.ownerOf(tokenId);
          assert.equal(newOwner, buyer, "The buyer should now be the owner of the NFT."); 
      
          // Assert that the correct amount of Ether was transferred to the first user account
          const finalSellerBalance = await web3.eth.getBalance(seller);
          const finalBuyerBalance = await web3.eth.getBalance(buyer);
          const sellerBalanceDifference = web3.utils.toBN(finalSellerBalance).sub(web3.utils.toBN(initialSellerBalance));
          const buyerBalanceDifference = web3.utils.toBN(initialBuyerBalance).sub(web3.utils.toBN(finalBuyerBalance));
      
          assert.equal(sellerBalanceDifference.toString(), salePrice, "The seller should have received the correct amount of Ether.");
          assert(buyerBalanceDifference.gt(web3.utils.toBN(salePrice)), "The buyer should have spent more than the purchase price due to gas fees.");
        } else {
          // Attempt to purchase NFT with incorrect Ether amount
          try {
            await customERC721.purchaseNFT(tokenId, { from: buyer, value: purchasePrice });
          } catch (error) {
                console.log("Purchase should have failed due to incorrect Ether amount.", error.message);
                // Assert that NFT ownership remains with the first user account and no Ether was transferred
                const owner = await customERC721.ownerOf(tokenId);
                const finalSellerBalance = await web3.eth.getBalance(seller);
                const finalBuyerBalance = await web3.eth.getBalance(buyer);
            
                assert.equal(owner, seller, "NFT ownership should remain with the first user account.");
                assert.equal(finalSellerBalance, initialSellerBalance, "The seller balance should remain unchanged.");
                assert.equal(finalBuyerBalance, initialBuyerBalance, "The buyer balance should remain unchanged.");
                throw error;
            }
        }
      });
      
});