async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    // const Token = await ethers.getContractFactory("Token");
    // const token = await Token.deploy();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy();

    const NFT = await ethers.getContractFactory("NFT6883");
    const nft = await NFT.deploy(marketplace.address);

    // console.log("Token address:", token.address);
    console.log("Market address:", marketplace.address);
    console.log("NFT address:", nft.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });