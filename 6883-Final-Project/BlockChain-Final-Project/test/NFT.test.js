const NFT = artifacts.require("./NFTMarketplace.sol");


// const NFT = artifacts.require("NFT");
const { expect } = require("chai");


contract("NFT", (accounts) => {
  const owner = accounts[0];
  const addr1 = accounts[1];
  
  
  let nft;

  beforeEach(async () => {
    nft = await NFT.new({ from: owner });
    
    
  });

  describe("Create and Test a new NFT", () => {
    it("Should create a new NFT", async () => {
      
      nft_id=2
      nft_name='testcase1'
      nft_description="This is the test case 1"

      await nft.createNFT(nft_id, nft_name, nft_description)

      const nft1= await nft.getNFT(nft_id)

      
      assert.equal(nft1.id, nft_id);
      assert.equal(nft1.name, nft_name);
      assert.equal(nft1.description, nft_description);
      assert.equal(nft1.owner, accounts[0]);
 
    });   
    
    it("should transfer ownership of the NFT to the second user account", async () => {
      //itemid could be changed as your prefer number
      const itemid = 10;
      // create NFT 
      await nft.createNFT(itemid, "Test NFT", "This is a test NFT");
      
      // transfer to second user
      await nft.transferNFT(addr1, itemid, {from: owner});

      const tokenId= await nft.gettokenID(itemid);

      // const newOwner=await nft.transferNFT(addr1, itemid, {from: owner});
      const newOwner = await nft.ownerOf(tokenId);
      
      assert.equal(newOwner, addr1, "Failed to transfer");
  });



  it("should list an NFT for sale", async () => {
    
    const addr2 = accounts[2];

    const itemId = 2;

   
    await nft.createNFT(itemId, "Test NFT", "This is a test NFT", { from: addr2 });


    
    const price = web3.utils.toWei("1", "ether");
    await nft.listNFTForSale(itemId, price, { from: addr2 });

  
    const tokenId= await nft.gettokenID(itemId);
    const nftInfo = await nft.getNFT(itemId);

    assert.equal(nftInfo.isForSale, true, "Failed to list NFT for sale");
    assert.equal(nftInfo.price, price, "NFT sale price is incorrect");
});

  


  it("Should remove an NFT from sale", async () => {
 
      const addr3 = accounts[3];
      itemid=1;

  
      await nft.createNFT(itemid, "Test NFT", "This is a test NFT", {from: addr3});

    
      await nft.listNFTForSale(itemid, web3.utils.toWei("1", "ether"), {from: addr3});

      

   
      // const listedNFT = await nft.nfts(itemid);
      // assert.equal(listedNFT.isForSale, true, "Failed to list NFT for sale");
      // assert.equal(listedNFT.price, web3.utils.toWei("1", "ether"), "Failed to set NFT sale price");

    
      await nft.removeNFTFromSale(itemid, {from: addr3});

     
      const tokenId= await nft.gettokenID(itemid);
      const unlistedNFT = await nft.getNFT(itemid);


      


      // make sure NFT no longer sale
      // const unlistedNFT = await nft.nfts(1);
      assert.equal(unlistedNFT.isForSale, false, "Failed to remove NFT from sale");
      assert.equal(unlistedNFT.couldSale, false, "Failed to remove as you do not set couldSale as false");
      assert.equal(unlistedNFT.price, 0, "Failed to reset NFT sale price");
    });
    


    // check purchase
    it("should execute a successful NFT purchase", async () => {
      // const marketplace = await NFTMarketplace.deployed();
      nft = await NFT.deployed();
      const user4 = accounts[4];
      const user5 = accounts[5];

      itemid=1
      
      
      await nft.createNFT(itemid, "MyNFT", "http://ipfs.io/my-nft", { from: user4 });


      
      const salePrice = web3.utils.toWei("0.01", "ether");
      await nft.listNFTForSale(itemid, salePrice, { from: user4 });

      const nft_info = await nft.getNFT(itemid);
      assert.equal(nft_info.isForSale, true, "NFT is not listed for sale");

      
      const tokenId= await nft.gettokenID(itemid);

      

      //approval to buyer
      await nft.approve(user5, tokenId, { from: nft_info.owner });

      const approvedAddress = await nft.getApproved(tokenId);
      assert.equal(approvedAddress, user5, "NFT approval failed");


      // get balance before purchase
      const initialUser4Balance = await web3.eth.getBalance(user4);
      const initialBuyerBalance= await web3.eth.getBalance(user5);
      
      await nft.purchaseNFT(itemid, { from: user5, value: salePrice });

    
   
  
      
      const newOwner = await nft.ownerOf(tokenId);
      //expect(newOwner).to.equal(user5);
      assert.equal(newOwner, user5, "Failed as NFT is not ownered by second user");
  
      
      // const user4Balance = await web3.eth.getBalance(user4);
      // const expectedBalance = web3.utils.toBN(user4Balance).add(web3.utils.toBN(salePrice)).toString();

      


      // get user1's current balance 
      const finalUser4Balance = await web3.eth.getBalance(user4);
      const finalUserBalance=web3.utils.toBN(finalUser4Balance).toString();

      const finalBuyerBalance = await web3.eth.getBalance(user5);
      const finalBuyerBalance1=web3.utils.toBN(finalBuyerBalance).toString();


      // calaculate expected balance
      
      const expectedBalance = web3.utils.toBN(initialUser4Balance).add(web3.utils.toBN(salePrice)).toString();

      //const expectedcost = web3.utils.toBN(initialBuyerBalance).sub(web3.utils.toBN(finalBuyerBalance1)).toString();

 
      //expect(expectedBalance).to.equal(user1Balance);链上问题，计算差值，下面这个不行，好像转换的时候有误差
      assert.equal(finalUserBalance,expectedBalance,"failed as the first account does not receive the correct money");
      //assert.equal(expectedcost,salePrice,"failed as the first account does not receive the correct money");
      
      
      // tolerance
      // const tolerance = web3.utils.toWei("0.0001", "ether");
      // const balanceDifference = web3.utils.toBN(expectedBalance).sub(web3.utils.toBN(finalUser4Balance)).abs();
      // const balanceDifferenceInEther = web3.utils.fromWei(balanceDifference, "ether");
      // assert(Number(balanceDifferenceInEther) <= Number(tolerance), "failed as the first account does not receive the correct money");



    });





    // Testcase 6
    it("should execute an unsuccessful NFT purchase when using an incorrect amount of Ether", async () => {
      // Create two user accounts
      const user1 = accounts[0];
      const user2 = accounts[1];
    
      // Use the first user account to create a new NFT and set the sale price to 1 ether
      const itemId = 1;
      const salePrice = web3.utils.toWei("0.04", "ether");
      await nft.createNFT(itemId, "MyNFT", "http://ipfs.io/my-nft", { from: user1 });
      await nft.listNFTForSale(itemId, salePrice, { from: user1 });


      const nft_info = await nft.getNFT(itemid);
      assert.equal(nft_info.isForSale, true, "NFT is not listed for sale");

      //get tokenId
      const tokenId= await nft.gettokenID(itemid);
          
      
      await nft.approve(user2, tokenId, { from: nft_info.owner });

      const approvedAddress = await nft.getApproved(tokenId);
      assert.equal(approvedAddress, user2, "NFT approval failed");

    
      const balance1_init = await web3.eth.getBalance(user1);
      const balance2_init = await web3.eth.getBalance(user2);


      // Attempt to purchase the NFT using the second user account with an incorrect amount of Ether,only when money smaller than salePrice, it will return error as the contract allow to return money
      const incorrectPrice = web3.utils.toWei("0.02", "ether");
      try {
        await nft.purchaseNFT(itemId, { from: user2, value: incorrectPrice });
        assert.fail("Expected purchaseNFT function to revert");
      } catch (error) {
        assert.include(
          error.message,
          "revert",
          "Expected purchaseNFT function to revert with invalid Ether amount"
        );
      }
    
      // Confirm that the NFT ownership remains with the first user account and no Ether was transferred
      const owner = await nft.ownerOf(tokenId);
      const balance1 = await web3.eth.getBalance(user1);
      const balance2 = await web3.eth.getBalance(user2);
      assert.equal(owner, user1, "NFT ownership should remain with the first user account");
      assert.equal(
        web3.utils.toBN(balance1).toString(),
        web3.utils.toBN(balance1_init).toString(),
        "NFT purchase should not transfer any Ether to the first user account"
      );
      assert.equal(
        web3.utils.toBN(balance2).toString(),
        web3.utils.toBN(balance2_init).toString(),
        "NFT purchase should not transfer any Ether from the second user account"
      );
    });
    

  
  });
});

// contract("NFT", (accounts) => {
//   let nft;
//   const owner = accounts[0];

//   beforeEach(async () => {
//     nft = await NFT.new({ from: owner });
//   });

//   it("should be deployed", async () => {
//     assert(nft.address !== "");
//   });

//   it("should have correct name and symbol", async () => {
//     const name = await nft.name();
//     const symbol = await nft.symbol();
//     assert.equal(name, "DApp NFT");
//     assert.equal(symbol, "DAPP");
//   });

//   it("should mint a new NFT", async () => {
//     const tokenId = await nft.mint("https://example.com/token/1");
//     const tokenURI = await nft.tokenURI(tokenId);

//     assert.equal(tokenId.toNumber(), 1, "Token ID is not correct");
//     assert.equal(tokenURI, "https://example.com/token/1", "Token URI is not correct");
//     assert.equal(await nft.ownerOf(tokenId), owner, "Token owner is not correct");
//   });

//   it("should increase token count after minting", async () => {
//     const initialTokenCount = await nft.tokenCount();
//     await nft.mint("https://example.com/token/1");
//     const newTokenCount = await nft.tokenCount();

//     assert.equal(initialTokenCount.toNumber(), 0, "Initial token count is not correct");
//     assert.equal(newTokenCount.toNumber(), 1, "New token count is not correct");
//   });
// });
