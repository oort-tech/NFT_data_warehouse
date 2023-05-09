const NFTMarketplace = artifacts.require('NFTMarketplace');

contract('NFTMarketplace', (accounts) => {
    it('should create a new NFT', async () => {
        const nftSender = accounts[0];

        //print the balance after migration and its gas fee
        var nftSenderBalance = await web3.eth.getBalance(nftSender);
        console.log("User 1 Balance after migratiton: ", web3.utils.fromWei(nftSenderBalance, 'ether'));
        console.log("Migration gas fee: ", 100 - web3.utils.fromWei(nftSenderBalance, 'ether'));

        //create contract's instance
        const NFTInstance = await NFTMarketplace.deployed();
        
        //create NFT
        await NFTInstance.createNFT("banana", "it is banana", "https://ipfs.io/ipfs/bafybeiadjwxddlh4poqqa5i64hxypss4rbn6bxwxddbi5eh7tbyx3plo54/{id}.json");
        
        //print the balance after NFT created and its gas fee
        var nftSenderBalanceAfterNFTCreate = await web3.eth.getBalance(nftSender);
        console.log("User 1 Balance after NFT 1 created: ", web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether'));
        console.log("NFT 1 creation gas fee: ", web3.utils.fromWei(nftSenderBalance, 'ether') -  web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether'));
        
        //read the NFT's name and description
        const nftName = (await NFTInstance.printNFTsName.call(1)).toString();
        const nftDescription = (await NFTInstance.printNFTsDescription.call(1)).toString();
        
        //compared result
        assert(nftName == "banana", "The name is not correct");
        assert(nftDescription == "it is banana", "The description is not correct");

    })
    
    it('should send to the right address', async () => {
        //assign two accounts
        const nftSender = accounts[0];
        const nftReceiver = accounts[1];

        //create contract's instance
        const NFTInstance = await NFTMarketplace.deployed();

        //check the balance before create NFT
        var nftSenderBalance = await web3.eth.getBalance(nftSender);
        
        //create NFT
        await NFTInstance.createNFT("motorcycle", "it is motorcycle", "https://ipfs.io/ipfs/bafybeiadjwxddlh4poqqa5i64hxypss4rbn6bxwxddbi5eh7tbyx3plo54/{id}.json");
        
        //print the balance after NFT created and its gas fee
        var nftSenderBalanceAfterNFTCreate = await web3.eth.getBalance(nftSender);
        console.log("User 1 Balance after NFT 2 created: ", web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether'));
        console.log("NFT 2 creation gas fee: ", web3.utils.fromWei(nftSenderBalance, 'ether') -  web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether'));

        //read the NFT ownership and compare it with current owner
        var nftOwnership = (await NFTInstance.printNFTsOwner.call(2));
        assert(nftOwnership == nftSender, "The NFT sender is not correct");
        
        //transfer NFT
        await NFTInstance.transferNFT(nftReceiver, 2);

        //print the balance after NFT transferred and its gas fee
        var nftSenderBalanceAfterNFTTransfer = await web3.eth.getBalance(nftSender);
        console.log("User 1 Balance after NFT 2 transferred: ", web3.utils.fromWei(nftSenderBalanceAfterNFTTransfer, 'ether'));
        console.log("NFT 2 transfer gas fee: ", web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether') -  web3.utils.fromWei(nftSenderBalanceAfterNFTTransfer, 'ether'));
        
        //read the NFT ownership and compare it with current owner
        nftOwnership =  (await NFTInstance.printNFTsOwner.call(2));
        assert(nftOwnership == nftReceiver, "The NFT receiver is not correct");
    })

    it('should list the right NFTs to sale', async () => {
        //create contract's instance
        const NFTInstance = await NFTMarketplace.deployed();

        //check the balance before create NFT
        const nftSender = accounts[0];
        var nftSenderBalance = await web3.eth.getBalance(nftSender);

        //create NFT
        await NFTInstance.createNFT("car", "it is car", "https://ipfs.io/ipfs/bafybeiadjwxddlh4poqqa5i64hxypss4rbn6bxwxddbi5eh7tbyx3plo54/{id}.json");
        
        //print the balance after NFT created and its gas fee
        var nftSenderBalanceAfterNFTCreate = await web3.eth.getBalance(nftSender);
        console.log("User 1 Balance after NFT 3 created: ", web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether'));
        console.log("NFT 3 creation gas fee: ", web3.utils.fromWei(nftSenderBalance, 'ether') -  web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether'));

        //list NFT for sale
        await NFTInstance.listNFTForSale(3, 100);

        //print the balance after NFT list for sale and its gas fee
        var nftSenderBalanceAfterNFTlisted = await web3.eth.getBalance(nftSender);
        console.log("User 1 Balance after NFT 3 listed for sale: ", web3.utils.fromWei(nftSenderBalanceAfterNFTlisted, 'ether'));
        console.log("NFT 3 listed for sale gas fee: ", web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether') -  web3.utils.fromWei(nftSenderBalanceAfterNFTlisted, 'ether'));

        //read the NFT's price and sale status
        const nftPrice = (await NFTInstance.printNFTsPrice.call(3));
        const nftforSale = (await NFTInstance.printNFTsforSale.call(3));
        
        //compared the result
        assert(nftPrice == 100, "car's price is wrong");
        assert(nftforSale == true, "car's sale status is wrong");
    
    })

    it('should remove the right NFTs from sale list', async () => {
        //create contract's instance
        const NFTInstance = await NFTMarketplace.deployed();
        
        //check the balance before create NFT
        const nftSender = accounts[0];
        nftSenderBalance = await web3.eth.getBalance(nftSender);
        
        //create NFT
        await NFTInstance.createNFT("boat", "it is boat", "https://ipfs.io/ipfs/bafybeiadjwxddlh4poqqa5i64hxypss4rbn6bxwxddbi5eh7tbyx3plo54/{id}.json");
        
        //print the balance after NFT created and its gas fee
        var nftSenderBalanceAfterNFTCreate = await web3.eth.getBalance(nftSender);
        console.log("User 1 Balance after NFT 4 created: ", web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether'));
        console.log("NFT 4 creation gas fee: ", web3.utils.fromWei(nftSenderBalance, 'ether') -  web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether'));
        
        //list NFT for sale
        await NFTInstance.listNFTForSale(4, 1000000);

        //print the balance after NFT list for sale and its gas fee
        var nftSenderBalanceAfterNFTlisted = await web3.eth.getBalance(nftSender);
        console.log("User 1 Balance after NFT 4 listed for sale: ", web3.utils.fromWei(nftSenderBalanceAfterNFTlisted, 'ether'));
        console.log("NFT 4 listed for sale gas fee: ", web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether') -  web3.utils.fromWei(nftSenderBalanceAfterNFTlisted, 'ether'));

        //read the NFT's price and sale status
        const nftPrice = (await NFTInstance.printNFTsPrice.call(4));
        var nftforSale = (await NFTInstance.printNFTsforSale.call(4));

        //compare the result
        assert(nftPrice == 1000000, "boat's price is wrong");
        assert(nftforSale == true, "boat's sale status is wrong");
        
        //remove the NFT from the sale list
        await NFTInstance.removeNFTFromSale(4);
        
        //print the balance after NFT removed from the sale list and its gas fee
        var nftSenderBalanceAfterNFTRemoved = await web3.eth.getBalance(nftSender);
        console.log("User 1 Balance after NFT 4 removed from list: ", web3.utils.fromWei(nftSenderBalanceAfterNFTRemoved, 'ether'));
        console.log("NFT 4 removed gas fee: ", web3.utils.fromWei(nftSenderBalanceAfterNFTlisted, 'ether') -  web3.utils.fromWei(nftSenderBalanceAfterNFTRemoved, 'ether'));

        //read teh sale status
        nftforSale = (await NFTInstance.printNFTsforSale.call(4));

        //compare the result
        assert(nftforSale == false, "boat's sale status is wrong");
    
    })

    it('should purchase the right NFTs from sale list', async () => {
        const NFTInstance = await NFTMarketplace.deployed();

        // Define seller and buyer accounts
        const seller = accounts[0];
        const buyer = accounts[1];
    
        // Token URI for the NFT
        const tokenURI = "https://ipfs.io/ipfs/bafybeiadjwxddlh4poqqa5i64hxypss4rbn6bxwxddbi5eh7tbyx3plo54/{id}.json";
    
        // Create an NFT with the seller account
        await NFTInstance.createNFT("plane", "it is a plane", tokenURI, { from: seller });
        
        // Check the balance after mint
        var nftSenderBalanceAfterNFTCreate = await web3.eth.getBalance(seller);
        console.log("User 1 Balance after NFT 5 created: ", web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether'));
        console.log("NFT 5 creation gas fee: ", web3.utils.fromWei(nftSenderBalance, 'ether') -  web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether'));

        // Define the tokenId and sale price
        const tokenId = 5;
        const salePrice = 1000000000000000;
    
        // List the NFT for sale with the specified price
        await NFTInstance.listNFTForSale(tokenId, salePrice, { from: seller });
        var nftSenderBalanceAfterNFTlisted = await web3.eth.getBalance(seller);
        console.log("User 1 Balance after NFT 5 listed for sale: ", web3.utils.fromWei(nftSenderBalanceAfterNFTlisted, 'ether'));
        console.log("NFT 5 listed for sale gas fee: ", web3.utils.fromWei(nftSenderBalanceAfterNFTCreate, 'ether') -  web3.utils.fromWei(nftSenderBalanceAfterNFTlisted, 'ether'));

        // Set approval for the buyer to purchase the NFT
        await NFTInstance.setApprovalForAll(buyer, true, { from: seller });
        var nftSenderBalanceAfterNFTApproval = await web3.eth.getBalance(seller);
        console.log("User 1 Balance after NFT 5 approved for sale: ", web3.utils.fromWei(nftSenderBalanceAfterNFTApproval, 'ether'));
        console.log("NFT 5 approval gas fee: ", web3.utils.fromWei(nftSenderBalanceAfterNFTlisted, 'ether') -  web3.utils.fromWei(nftSenderBalanceAfterNFTApproval, 'ether'));

        // Get the buyer's balance before the purchase
        const buyerBalanceBeforePurchase = await web3.eth.getBalance(buyer);
        console.log("buyer(User 2) Balance Before Purchase: ", web3.utils.fromWei(buyerBalanceBeforePurchase, 'ether'));
        const sellerBalanceBeforePurchase = await web3.eth.getBalance(seller);
        console.log("seller(User 1) Balance Before Purchase: ", web3.utils.fromWei(sellerBalanceBeforePurchase, 'ether'));

        // Purchase the NFT using the buyer account and specified sale price
        const txReceipt = await NFTInstance.purchaseNFT(tokenId, { from: buyer, value: salePrice });
    
        // Check if the NFT is now owned by the buyer
        const newOwner = await NFTInstance.nftCreators(tokenId);
        assert.equal(newOwner, buyer, "The NFT is not owned by the second user account");
    
        // Calculate the gas fee for the purchase transaction
        const txDetails = await web3.eth.getTransaction(txReceipt.tx);
        const gasUsed = txReceipt.receipt.gasUsed;
        const gasFee = web3.utils.toBN(gasUsed).mul(web3.utils.toBN(txDetails.gasPrice));
    
        // Get the buyer's balance after the purchase
        const buyerBalanceAfterPurchase = await web3.eth.getBalance(buyer);
        console.log("buyer(User 2) Balance After Purchase: ", web3.utils.fromWei(buyerBalanceAfterPurchase, 'ether'));
        const sellerBalanceAfterPurchase = await web3.eth.getBalance(seller);
        console.log("seller(User 1) Balance After Purchase: ", web3.utils.fromWei(sellerBalanceAfterPurchase, 'ether'));

        // Calculate the expected buyer's balance after the purchase
        const expectedBuyerBalance = web3.utils
          .toBN(buyerBalanceBeforePurchase)
          .sub(web3.utils.toBN(salePrice))
          .sub(gasFee);
    
        // Check if the correct amount of Ether was transferred to the seller
        assert.equal(
          buyerBalanceAfterPurchase,
          expectedBuyerBalance.toString(),
          "The correct amount of Ether was not transferred to the first user account"
          );
    })

    it("should execute an unsuccessful NFT purchase due to incorrect Ether amount", async () => {
        const NFTInstance = await NFTMarketplace.deployed();
    
        // Define seller and buyer accounts
        const seller = accounts[0];
        const buyer = accounts[1];
    
        // Token URI for the NFT
        const tokenURI = "https://ipfs.io/ipfs/bafybeiadjwxddlh4poqqa5i64hxypss4rbn6bxwxddbi5eh7tbyx3plo54/{id}.json";
    
        // Create an NFT with the seller account
        await NFTInstance.createNFT("plane", "it is a plane", tokenURI, { from: seller });
    
        // Check the balance after mint
        nftSenderBalance = await web3.eth.getBalance(seller);
        console.log("User 1 Balance after NFT 6 created: ",  web3.utils.fromWei(nftSenderBalance, 'ether'));

        // Define the tokenId and sale price
        const tokenId = 1;
        const salePrice = 100;
    
        // List the NFT for sale with the specified price
        await NFTInstance.listNFTForSale(tokenId, salePrice, { from: seller });
        nftSenderBalance = await web3.eth.getBalance(seller);
        console.log("User 1 Balance after NFT 6 list for sale: ",  web3.utils.fromWei(nftSenderBalance, 'ether'));

        // Set approval for the buyer to purchase the NFT
        await NFTInstance.setApprovalForAll(buyer, true, { from: seller });
        nftSenderBalance = await web3.eth.getBalance(seller);
        console.log("User 1 Balance after NFT 6 approved for sale sale: ",  web3.utils.fromWei(nftSenderBalance, 'ether'));

        const buyerBalanceBeforePurchase = await web3.eth.getBalance(buyer);
        console.log("buyer(User 2) Balance Before Purchase: ", web3.utils.fromWei(buyerBalanceBeforePurchase, 'ether'));

        try {
          // Attempt to purchase the NFT with incorrect Ether amount
          await NFTInstance.purchaseNFT(tokenId, { from: buyer, value: salePrice - 1 });

          // If the transaction goes through, the test fails
          assert.fail("The purchase should have failed due to incorrect Ether amount");
        } catch (error) {
          // Check if the error message contains the expected revert reason
          assert(error.message.includes("Insufficient funds to purchase this NFT"), "Unexpected error occurred");
    
          // Check if the NFT is still owned by the seller
          const currentOwner = await NFTInstance.nftCreators(tokenId);
          assert.equal(currentOwner, seller, "The NFT should still be owned by the seller");
        
          // Check if the buyer been charged after false purchase
          const buyerBalanceAfterPurchase = await web3.eth.getBalance(buyer);
          console.log("buyer(User 2) Balance After Purchase: ", web3.utils.fromWei(buyerBalanceAfterPurchase, 'ether'));

          assert.equal(buyerBalanceBeforePurchase, buyerBalanceAfterPurchase, "The buyer has been flase charged");
        }
      })
})