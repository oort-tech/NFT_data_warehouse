const { expect } = require("chai"); 

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

describe("NFTMarketplace", function () {

let NFT_Marketplace;
let nft_marketplace;
  let deployer;
  let addr1;
  let addr2;
  let addrs;
  let feePercent = 1;
  let URI = "sample URI"

  beforeEach(async function () {
    // Get the ContractFactories and Signers here.
    NFT_Marketplace = await ethers.getContractFactory("NFT_Marketplace");
    [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contracts
    nft_marketplace = await NFT_Marketplace.deploy(feePercent);
  });

  describe("Deployment", function () {

    it("Should track name and symbol of the nft collection", async function () {
      // This test expects the owner variable stored in the contract to be equal
      // to our Signer's owner.
      const Name = "DApp NFT_Marketplace"
      const Symbol = "DAPP"
      expect(await nft_marketplace.name()).to.equal(Name);
      expect(await nft_marketplace.symbol()).to.equal(Symbol);
      expect(await nft_marketplace.feeAccount()).to.equal(deployer.address);
      expect(await nft_marketplace.feePercent()).to.equal(feePercent);
    });
  });

  describe("createNFT ing NFTs", function () {

    it("Should track each createNFT ed NFT", async function () {
      // addr1 createNFT s an nft
      await expect(nft_marketplace.connect(addr1).createNFT (URI, 123, "DINGZHEN", "RUIKE_V")).to.emit(nft_marketplace, "Created")
      .withArgs(
        1,
        123,
        "DINGZHEN",
        "RUIKE_V",
        addr1.address
      )
      expect(await nft_marketplace.tokenCount()).to.equal(1);
      expect(await nft_marketplace.balanceOf(addr1.address)).to.equal(1);
      expect(await nft_marketplace.tokenURI(1)).to.equal(URI);
      const item = await nft_marketplace.items(1)
      expect(item.tokenId).to.equal(1)
      expect(item.namedId).to.equal(123)
      expect(item.name).to.equal("DINGZHEN")
      expect(item.description).to.equal("RUIKE_V")
      expect(item.owner).to.equal(addr1.address)
      expect(item.onsale).to.equal(false)
      // addr2 createNFT s an nft
      await expect(nft_marketplace.connect(addr2).createNFT (URI, 321, "WANGYUAN", "FURONGWANG")).to.emit(nft_marketplace, "Created")
      .withArgs(
        2,
        321,
        "WANGYUAN",
        "FURONGWANG",
        addr2.address
      )
      expect(await nft_marketplace.tokenCount()).to.equal(2);
      expect(await nft_marketplace.balanceOf(addr2.address)).to.equal(1);
      expect(await nft_marketplace.tokenURI(2)).to.equal(URI);
      const item2 = await nft_marketplace.items(2)
      expect(item2.tokenId).to.equal(2)
      expect(item2.namedId).to.equal(321)
      expect(item2.name).to.equal("WANGYUAN")
      expect(item2.description).to.equal("FURONGWANG")
      expect(item2.owner).to.equal(addr2.address)
      expect(item2.onsale).to.equal(false)
    });
  })

    describe("Transfering NFT without price", function () {
        beforeEach(async function () {
            await nft_marketplace.connect(addr1).createNFT (URI, 123, "DINGZHEN", "RUIKE_V")
            await nft_marketplace.connect(addr2).createNFT (URI, 321, "WANGYUAN", "FURONGWANG")
        })
        it("Should transfer NFT1 from User1 to User2", async function () {
            await expect(nft_marketplace.connect(addr1).transferNFT(1 , addr2.address))
            .to.emit(nft_marketplace, "Gift")
            .withArgs(
                1,
                123,
                "DINGZHEN",
                "RUIKE_V",
                addr1.address,
                addr2.address
            )
            expect(await nft_marketplace.ownerOf(1)).to.equal(addr2.address);
            const item = await nft_marketplace.items(1)
            expect(item.tokenId).to.equal(1)
            expect(item.namedId).to.equal(123)
            expect(item.name).to.equal("DINGZHEN")
            expect(item.description).to.equal("RUIKE_V")
            expect(item.price).to.equal(0)
            expect(item.owner).to.equal(addr2.address)
            expect(item.onsale).to.equal(false)
        });

        it("Should fail if User1 does not own this NFT", async function () {
            await expect(nft_marketplace.connect(addr1).transferNFT(2 , addr1.address))
            .to.be.revertedWith("Your address does not own this NFT");
        });
    });

  describe("User lists an NFT for sale", function () {
    let price = 1
    let result 
    beforeEach(async function () {
        await nft_marketplace.connect(addr1).createNFT (URI, 123, "DINGZHEN", "RUIKE_V")
        await nft_marketplace.connect(addr2).createNFT (URI, 321, "WANGYUAN", "FURONGWANG")
     })


    it("Should put the NFT on sale, emit Offered event", async function () {
      // addr1 offers their nft at a price of 1 ether
      await expect(nft_marketplace.connect(addr1).listNFTForSale(1 , toWei(price)))
        .to.emit(nft_marketplace, "Offered")
        .withArgs(
            1,
            123,
            "DINGZHEN",
            "RUIKE_V",
            addr1.address,
            toWei(price)
        )
      // Get item from items mapping then check fields to ensure they are correct
      const item = await nft_marketplace.items(1)
      expect(item.tokenId).to.equal(1)
      expect(item.namedId).to.equal(123)
      expect(item.name).to.equal("DINGZHEN")
      expect(item.description).to.equal("RUIKE_V")
      expect(item.price).to.equal(toWei(price))
      expect(item.owner).to.equal(addr1.address)
      expect(item.onsale).to.equal(true)
    });

    it("Should fail if price is set to zero", async function () {
      await expect(
        nft_marketplace.connect(addr1).listNFTForSale(1, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });

    it("Should fail if the item is already on sale", async function () {
        nft_marketplace.connect(addr1).listNFTForSale(1, toWei(price))
        await expect(
          nft_marketplace.connect(addr1).listNFTForSale(1, toWei(price))
        ).to.be.revertedWith("This NFT is already on sale. Recall it first");
      });

  });

  describe("Recalling an listed NFT (remove from sale)", function () {
    let price = 1
    beforeEach(async function () {
        await nft_marketplace.connect(addr1).createNFT (URI, 123, "DINGZHEN", "RUIKE_V")
        await nft_marketplace.connect(addr1).listNFTForSale(1 , toWei(price))
        await nft_marketplace.connect(addr2).createNFT (URI, 321, "WANGYUAN", "FURONGWANG")
        await nft_marketplace.connect(addr2).listNFTForSale(2 , toWei(price))

    })
    it("Should let User1 recall NFT1", async function () {
        await expect(nft_marketplace.connect(addr1).removeNFTFromSale(1))
        .to.emit(nft_marketplace, "Recalled")
        .withArgs(
            1,
            123,
            "DINGZHEN",
            "RUIKE_V",
            addr1.address,
            toWei(price)
        )
        expect(await nft_marketplace.ownerOf(1)).to.equal(addr1.address);
        const item = await nft_marketplace.items(1)
        expect(item.tokenId).to.equal(1)
        expect(item.namedId).to.equal(123)
        expect(item.name).to.equal("DINGZHEN")
        expect(item.description).to.equal("RUIKE_V")
        expect(item.price).to.equal(toWei(price))
        expect(item.owner).to.equal(addr1.address)
        
        // This NFT is nolonger for sale
        expect(item.onsale).to.equal(false)
    });

    it("Should fail if User1 does not own this NFT", async function () {
        await expect(nft_marketplace.connect(addr1).removeNFTFromSale(2))
        .to.be.revertedWith("Your address does not own this NFT");
    });
});


  describe("Purchasing marketplace items", function () {
    let price = 2
    let fee = (feePercent/100)*price
    let totalPriceInWei
    beforeEach(async function () {
        await nft_marketplace.connect(addr1).createNFT (URI, 123, "DINGZHEN", "RUIKE_V")
        await nft_marketplace.connect(addr1).listNFTForSale(1 , toWei(price))
        await nft_marketplace.connect(addr2).createNFT (URI, 321, "WANGYUAN", "FURONGWANG")
        await nft_marketplace.connect(addr2).listNFTForSale(2 , toWei(price))
    })
    it("Should update item as sold, pay seller, transfer NFT to buyer, charge fees and emit a Bought event", async function () {
      const sellerInitalEthBal = await addr1.getBalance()
      const feeAccountInitialEthBal = await deployer.getBalance()
      // fetch items total price (market fees + item price)
      totalPriceInWei = await nft_marketplace.getTotalPrice(1);
      // addr 2 purchases item.
      await expect(nft_marketplace.connect(addr2).purchaseNFT(1, {value: totalPriceInWei}))
      .to.emit(nft_marketplace, "Bought")
        .withArgs(
          1,
          123,
          "DINGZHEN",
          "RUIKE_V",
          addr1.address,
          addr2.address,
          toWei(price)
        )
      const sellerFinalEthBal = await addr1.getBalance()
      const feeAccountFinalEthBal = await deployer.getBalance()
      // Item should be marked as sold
      expect((await nft_marketplace.items(1)).onsale).to.equal(false)
      // Seller should receive payment for the price of the NFT sold.
      expect((+fromWei(sellerFinalEthBal)).toFixed(10)).to.equal((+price + +fromWei(sellerInitalEthBal)).toFixed(10))
      // feeAccount should receive fee
      expect((+fromWei(feeAccountFinalEthBal)).toFixed(10)).to.equal((+fee + +fromWei(feeAccountInitialEthBal)).toFixed(10))
      // The buyer should now own the nft
      expect(await nft_marketplace.ownerOf(1)).to.equal(addr2.address);
    })
    it("Should fail for invalid item ids, sold items and when not enough ether is paid", async function () {
      // fails for invalid item ids
      await expect(
        nft_marketplace.connect(addr2).purchaseNFT(3, {value: totalPriceInWei})
      ).to.be.revertedWith("Invalid tokenId");
      await expect(
        nft_marketplace.connect(addr2).purchaseNFT(3, {value: totalPriceInWei})
      ).to.be.revertedWith("Invalid tokenId");
      // Fails when not enough ether is paid with the transaction. 
      // In this instance, fails when buyer only sends enough ether to cover the price of the nft
      // not the additional market fee.
      await expect(
        nft_marketplace.connect(addr2).purchaseNFT(1, {value: toWei(price)})
      ).to.be.revertedWith("not enough ether to cover item price and market fee"); 
      // addr2 purchases item 1
      await nft_marketplace.connect(addr2).purchaseNFT(1, {value: totalPriceInWei})
      // addr3 tries purchasing item 1 after its been sold 
      const addr3 = addrs[0]
      await expect(
        nft_marketplace.connect(addr3).purchaseNFT(1, {value: totalPriceInWei})
      ).to.be.revertedWith("item already sold / not for sale");
    });
  })
})
