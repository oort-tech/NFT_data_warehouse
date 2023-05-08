async function main() {
    const toWei = (num) => ethers.utils.parseEther(num.toString())
    let tax = toWei(0.1);
    const [operator] = await ethers.getSigners();
  
    console.log("Contract Operator:", operator.address);
  
    const PaintingMarketFactory = await ethers.getContractFactory("PaintingNFTContract");
    paintingNFTContract = await PaintingMarketFactory.deploy(
      operator.address,
      tax
    );
  
    console.log("Smart contract address:", paintingNFTContract.address)
  
    saveFrontendFiles(paintingNFTContract, "PaintingNFTContract");
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
  