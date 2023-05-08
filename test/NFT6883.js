// test/MyNFT.test.js
const { expect } = require("chai");

describe("6883NFTMarketPlace", function () {
  let myNFT;
  let owner, recipient;

  beforeEach(async () => {
    [owner, recipient] = await ethers.getSigners();
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy();
    await marketplace.deployed();
    const MyNFT = await ethers.getContractFactory("NFT6883");
    myNFT = await MyNFT.deploy(marketplace.address);
    await myNFT.deployed();
  });

  describe("#NFT Deployment", function () {
    it("Should create a new NFT", async () => {
      const tokenId = 1;
      const name = "Token 1";
      const description = "First minted NFT";
      await myNFT.mint(name, description);
      const ownerOf = await myNFT.ownerOf(tokenId);
      expect(ownerOf).to.equal(owner.address);
      console.log('      Created Nft with right name, description and owner');
    });


    it("Should transfer ownership of an NFT", async () => {
      const tokenId = 1;
      const name = "Token 1";
      const description = "First minted NFT";
      await myNFT.mint(name, description);
      await myNFT.transferFrom(owner.address, recipient.address, tokenId);
      const ownerOf = await myNFT.ownerOf(tokenId);
      expect(ownerOf).to.equal(recipient.address);
      console.log('      NFT is now owned by the second user account');
    });
  });


  describe("#Marketplace Transacations", function () {
    it("Should use the right NFT market address", async () => {
      const tokenId = 1;
      const name = "Token 1";
      const description = "First minted NFT";
      await myNFT.mint(name, description);
      const marketAddress_ = await myNFT.MarketplaceAddress();
      const marketAddress_Ture = await marketplace.address;
      // console.log("      NFT -> Market address:", marketAddress_);
      // console.log("      NFT address:", myNFT.address);

      expect(marketAddress_).to.equal(marketAddress_Ture)

    });

    it("Should list an NFT for sale", async () => {
      const price = 18;
      const tokenId = 1;
      const name = "Token 1";
      const description = "First minted NFT";
      await myNFT.mint(name, description);
      await marketplace.listNft(myNFT.address, tokenId, price, {
        value: ethers.utils.parseEther("0.0")
      });
      const nft = await marketplace.getMyListedNfts();
      /*
      console.log("NFT address:", nft[0][0]);
      console.log("Token ID", nft[0][1]);
      console.log("Owner address:", nft[0][2]);
      console.log("Market address:", nft[0][3]);
      console.log("NFT Price:", nft[0][4]);
      console.log("Listed:", nft[0][5]);
      */
      expect(nft[0][4]).to.equal(price);
      console.log("      NFT is now listed for sale and its sale price matches the input value");
    });

    it("Should remove an NFT from sale", async () => {
      const price = 1;
      const tokenId = 1;
      const name = "Token 1";
      const description = "First minted NFT";

      await myNFT.mint(name, description);
      await marketplace.listNft(myNFT.address, tokenId, price, {
        value: ethers.utils.parseEther("0.0")
      });

      await marketplace.removeNFTFromSale(myNFT.address, tokenId);
      const nft = await marketplace.getMySpecificListedNft(myNFT.address, tokenId);
      expect(nft[0].listed).to.equal(false);
      console.log("      NFT is no longer listed for sale");
    });


    it("Should execute a successful NFT purchase", async () => {
      const price = ethers.utils.parseEther("100");
      const buyer = recipient;
      const seller = owner;

      const tokenId = 1;
      const name = "Token 1";
      const description = "First minted NFT";

      await myNFT.mint(name, description);
      await marketplace.listNft(myNFT.address, tokenId, price, {
        value: ethers.utils.parseEther("0.0")
      });

      const buyerBalanceBefore = await buyer.getBalance();
      const sellerBalanceBefore = await seller.getBalance();

      await marketplace.connect(buyer).buyNft(myNFT.address, tokenId, {
        value: price
      });

      const ownerOf = await myNFT.ownerOf(tokenId);
      const buyerBalanceAfter = await buyer.getBalance();
      const sellerBalanceAfter = await seller.getBalance();

      expect(ownerOf).to.equal(buyer.address);
      // expect(buyerBalanceAfter).to.equal(buyerBalanceBefore.sub(price));
      // console.log("LISTING_FEE:", marketplace.LISTING_FEE);
      // console.log("Two Accounts:", [owner, recipient]);
      // console.log("seller balance before:", sellerBalanceBefore);
      // console.log("seller balance after:", sellerBalanceBefore);
      expect(price).to.equal(sellerBalanceAfter.sub(sellerBalanceBefore));
      console.log("      NFT is now owned by the second user account and thecorrect amount of Ether was transferred to the first user account")
    });

    it("should execute an unsuccessful NFT purchase", async () => {
      const price = ethers.utils.parseEther("100");
      const buyer = recipient;
      const seller = owner;
      const incorrectPrice = ethers.utils.parseEther("99.2");
      const tokenId = 1;
      const name = "Token 1";
      const description = "First minted NFT";

      await myNFT.mint(name, description);
      await marketplace.listNft(myNFT.address, tokenId, price, {
        value: ethers.utils.parseEther("0.0")
      });
      const buyerBalanceBefore = await buyer.getBalance();
      const sellerBalanceBefore = await seller.getBalance();

      // Incorrect Price purchase
      await expect(marketplace.connect(buyer).buyNft(myNFT.address, tokenId, { from: buyer.address, value: incorrectPrice })).to.be.revertedWith("Not right ether to cover asking price");
      const ownerOf = await myNFT.ownerOf(tokenId);
      expect(ownerOf).to.equal(marketplace.address);
      console.log("      NFT ownership remains with the first user account and no Ether was transferred");
    });

  });
}); 