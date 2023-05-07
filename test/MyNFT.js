const MyNFT = artifacts.require("MyNFT");

contract("MyNFT", (accounts) => {
  const [owner, recipient] = accounts;
  let myNFT;

  beforeEach(async () => {
    myNFT = await MyNFT.new({ from: owner });
  });

  it("can create a new NFT", async () => {
    const tokenId = 0;
    const name = "Apple";
    const description = "Red and good";
    await myNFT.createNFT(owner, name, description, { from: owner });

    const nftDetails = await myNFT.nftDetails(tokenId);
    const tokenURI = await myNFT.tokenURI(tokenId);

    expect(nftDetails.name).to.equal(name);
    expect(nftDetails.description).to.equal(description);
    expect(tokenURI).to.equal(`https://example.com/token/${tokenId}`);
  });

  it("can transfer ownership of an NFT", async () => {
    const tokenId = 0;
    const name = "Apple";
    const description = "Red and Good";

    await myNFT.createNFT(owner, name, description, { from: owner });
    await myNFT.transferFrom(owner, recipient, tokenId, { from: owner });

    // Check if the new owner of the NFT is in the second user account
    const newOwner = await myNFT.ownerOf(tokenId);
    expect(newOwner).to.equal(recipient);
  });

  it("can list an NFT for sale", async () => {
    const tokenId = 0;
    const name = "Apple";
    const description = "Red and Good";
    //function called from web3.js; set the ether amount
    const salePrice = web3.utils.toWei("1", "ether");
  
    await myNFT.createNFT(owner, name, description, { from: owner });
    await myNFT.listNFTForSale(tokenId, salePrice, { from: owner });
  
    // Check if the NFT is for sale and the price is correct
    const nftSalePrice = await myNFT.nftSalePrices(tokenId);
    expect(nftSalePrice.toString()).to.equal(salePrice);
  });

  it("can remove an NFT from sale", async () => {
    const tokenId = 0;
    const name = "Apple";
    const description = "Red and Good";
    const salePrice = web3.utils.toWei("1", "ether");
  
    await myNFT.createNFT(owner, name, description, { from: owner });
    await myNFT.listNFTForSale(tokenId, salePrice, { from: owner });
    // Remove the NFT from sale 
    await myNFT.removeNFTFromSale(tokenId, { from: owner });
  
    // Check if the NFT is not for sale which the ether price should be zero
    const nftSalePrice = await myNFT.nftSalePrices(tokenId);
    expect(nftSalePrice.toString()).to.equal("0");
  });

  it("can execute a successful NFT purchase", async () => {
    const tokenId = 0;
    const name = "Apple";
    const description = "Red and Good";
    const salePrice = web3.utils.toWei("0.01", "ether");
  
  
    await myNFT.createNFT(owner, name, description, { from: owner });
    await myNFT.listNFTForSale(tokenId, salePrice, { from: owner });
    const initialOwnerBalance = await web3.eth.getBalance(owner);
  
    // Purchase the NFT using the purchaseNFT function with the second user account and the correct amount of Ether
    await myNFT.purchaseNFT(tokenId, { from: recipient, value: salePrice });
  
    // Check if the NFT is in second user's address
    const newOwner = await myNFT.ownerOf(tokenId);
    expect(newOwner).to.equal(recipient);
    // check the ether 
    const finalOwnerBalance = await web3.eth.getBalance(owner);
    const expectedFinalBalance = web3.utils.toBN(initialOwnerBalance).add(web3.utils.toBN(salePrice)).toString();
    expect(finalOwnerBalance).to.equal(expectedFinalBalance);
  });


  it("cannot execute an unsuccessful NFT purchase &\n"+"      NFT ownership remains with the first user account and no Ether was transferred\n ", async () => {
    const tokenId = 0;
    const name = "Apple";
    const description = "Red and Good";
    const salePrice = web3.utils.toWei("1", "ether");
    const incorrectAmount = web3.utils.toWei("0.5", "ether");
  
    await myNFT.createNFT(owner, name, description, { from: owner });
    await myNFT.listNFTForSale(tokenId, salePrice, { from: owner });
  
    // Attempt to purchase the NFT from second user with incorrect ether amount
    try {
      await myNFT.purchaseNFT(tokenId, { from: recipient, value: incorrectAmount });
      assert.fail("NFT purchase should have failed due to incorrect Ether amount");
    } catch (error) {
      const expectedError = "VM Exception while processing transaction: revert Incorrect Ether amount -- Reason given: Incorrect Ether amount.";
      expect(error.message).to.equal(expectedError);
    }
  
    // Check the ownership
    const currentOwner = await myNFT.ownerOf(tokenId);
    expect(currentOwner).to.equal(owner);
  
    // Check the Ether value
    const ownerBalance = await web3.eth.getBalance(owner);
    const recipientBalance = await web3.eth.getBalance(recipient);
    expect(ownerBalance).to.not.equal(recipientBalance);
  });

});
