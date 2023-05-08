const { expect } = require("chai");

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

describe("PaintingNFTContract", function () {

    let paintingNFTContract
    let operator, user1, user2, user3;
    let tax = toWei(0.1);
    beforeEach(async function () {
      const PaintingMarketFactory = await ethers.getContractFactory("PaintingNFTContract");
      [operator, user1, user2, user3] = await ethers.getSigners();
  
      paintingNFTContract = await PaintingMarketFactory.deploy(
        operator.address,
        tax
      );
    });

    describe("Contract Deployment Test", function () {

        it("Test name, symbol, tax and operator are correct", async function () {
            const name = "DAppFi"
            const symbol = "DAPP"
            expect(await paintingNFTContract.name()).to.equal(name);
            expect(await paintingNFTContract.symbol()).to.equal(symbol);
            expect(await paintingNFTContract.tax()).to.equal(tax);
            expect(await paintingNFTContract.operator()).to.equal(operator.address);
          });

    })

    describe("NFT Creation Test", function () {

      it("Test creation of NFT and ownership", async function () {
          await paintingNFTContract.connect(user1).createNFT("www.google.com")
          expect(await paintingNFTContract.ownerOf(0)).to.equal(user1.address)
        });

  })

  describe("NFT Transaction Test", function () {

    it("Test list NFT", async function () {
        await paintingNFTContract.connect(user1).createNFT("www.google.com")
        await paintingNFTContract.connect(user1).listNFT(0, toWei(10))
        expect(await paintingNFTContract.ownerOf(0)).to.equal(paintingNFTContract.address)
      });

    it("Test cancel list NFT", async function () {
        await paintingNFTContract.connect(user1).createNFT("www.google.com")
        await paintingNFTContract.connect(user1).listNFT(0, toWei(10))
        await paintingNFTContract.connect(user1).cancelListNFT(0)
        expect(await paintingNFTContract.ownerOf(0)).to.equal(user1.address)
        expect((await paintingNFTContract.paintings(0)).owner).to.equal(user1.address)
      });

    it("Test buy NFT", async function () {
        const NFTprice = toWei(1)
        const total = toWei(1.1) // price + tax
        await paintingNFTContract.connect(user1).createNFT("www.google.com")
        await paintingNFTContract.connect(user1).listNFT(0, NFTprice)

        const balanceOfUser1 = await user1.getBalance()
        const balanceOfOperator = await operator.getBalance()

        await paintingNFTContract.connect(user2).buyNFT(0, NFTprice, { value: total });

        const finalBalanceOfOperator = await operator.getBalance()
        const finalBalanceOfUser1 = await user1.getBalance()
        
        expect(await paintingNFTContract.ownerOf(0)).to.equal(user2.address)
        expect((await paintingNFTContract.paintings(0)).owner).to.equal(user2.address)
        
        expect(+fromWei(finalBalanceOfOperator)).to.equal(+fromWei(tax) + +fromWei(balanceOfOperator))
        expect(+fromWei(finalBalanceOfUser1)).to.equal(+fromWei(NFTprice) + +fromWei(balanceOfUser1))
      });

    it("Test NFT getter", async function () {
      const NFTprice = toWei(1)
      await paintingNFTContract.connect(user1).createNFT("www.google.com")
      await paintingNFTContract.connect(user1).listNFT(0, NFTprice)
      let listPaintings = [0]
      const unsoldPaintings = await paintingNFTContract.getUnsoldNFT()
      const user1Paintings = await paintingNFTContract.connect(user1).getMyNotListedNFT()
      const user2Paintings = await paintingNFTContract.connect(user2).getMyNFT()
      const user3Paintings = await paintingNFTContract.connect(user1).getMyListedNFT()
      expect(unsoldPaintings.every(i => listPaintings.includes(i.tokenId.toNumber()))).to.equal(true)
      expect(user1Paintings.every(i => listPaintings.includes(i.tokenId.toNumber()))).to.equal(true)
      expect(user2Paintings.every(i => !listPaintings.some(j => j === i.tokenId.toNumber()))).to.equal(true)
      expect(user3Paintings.every(i => !listPaintings.some(j => j === i.tokenId.toNumber()))).to.equal(false)
    });
    
  })

})