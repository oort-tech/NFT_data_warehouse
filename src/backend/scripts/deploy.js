async function main() {

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contracts here:

  const NFT_Marketplace = await ethers.getContractFactory("NFT_Marketplace");
  // For each contract, pass the deployed contract and name to this function to save a copy of the contract ABI and address to the front end.

  const nft_marketplace = await NFT_Marketplace.deploy(1);

  console.log("NFT_Marketplace contract address", nft_marketplace.address)
  // Save copies of each contracts abi and address to the frontend.

  saveFrontendFiles(nft_marketplace , "NFT_Marketplace");
}

function saveFrontendFiles(contract, name) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../../frontend/contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
