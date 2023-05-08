// Import the smart contract artifact
const NFTMarketplace = artifacts.require("NFTMarketplace");

contract("NFTMarketplace", (accounts) => {
  let nftMarketplace;

  // Deploy a new instance of the smart contract before each test case
  beforeEach(async () => {
    nftMarketplace = await NFTMarketplace.new({ from: accounts[0] });
  });

  it("should create a new NFT", async () => {
    const tokenId = 1;
    const name = "My NFT";
    const description = "A test NFT";

    await nftMarketplace.createNFT(tokenId, name, description, { from: accounts[0] });

    const nft = await nftMarketplace.getNFT(tokenId);
    assert.equal(nft.name, name, "NFT name does not match");
    assert.equal(nft.description, description, "NFT description does not match");
  });

  it("should transfer ownership of an NFT", async () => {
    const tokenId = 1;

    await nftMarketplace.createNFT(tokenId, "My NFT", "A test NFT", { from: accounts[0] });
    await nftMarketplace.transferNFT(accounts[1], tokenId, { from: accounts[0] });

    const owner = await nftMarketplace.ownerOf(tokenId);
    assert.equal(owner, accounts[1], "NFT ownership was not transferred");
  });

  it("should list an NFT for sale", async () => {
    const tokenId = 1;
    const price = web3.utils.toWei("1", "ether");

    await nftMarketplace.createNFT(tokenId, "My NFT", "A test NFT", { from: accounts[0] });
    await nftMarketplace.listNFTForSale(tokenId, price, { from: accounts[0] });

    const nft = await nftMarketplace.getNFT(tokenId);
    assert.equal(nft.forSale, true, "NFT was not listed for sale");
    assert.equal(nft.price, price, "NFT sale price does not match");
  });

  it("should remove an NFT from sale", async () => {
    const tokenId = 1;

    await nftMarketplace.createNFT(tokenId, "My NFT", "A test NFT", { from: accounts[0] });
    await nftMarketplace.listNFTForSale(tokenId, web3.utils.toWei("1", "ether"), { from: accounts[0] });
    await nftMarketplace.removeNFTFromSale(tokenId, { from: accounts[0] });

    const nft = await nftMarketplace.getNFT(tokenId);
    assert.equal(nft.forSale, false, "NFT was not removed from sale");
    assert.equal(nft.price, 0, "NFT sale price was not reset");
  });

  it("should execute a successful NFT purchase", async () => {
    const tokenId = 1;
    const price = web3.utils.toWei("1", "ether");

    await nftMarketplace.createNFT(tokenId, "My NFT", "A test NFT", {
