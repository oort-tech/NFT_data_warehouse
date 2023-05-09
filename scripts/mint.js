/*
  You can use this script to quickly manually mintNFTs. To do so:
  Run `truffle exec ./scripts/mint.js`
  If you want to mint more than one NFT, just pass in the number
 */
var ELEN_E6883_NFT = artifacts.require("./ELEN_E6883_NFT.sol");
const getErrorMessage = require("../scripts/getErrorMessage.js");

const main = async (cb) => {
  try {
    const args = process.argv.slice(4);
    const numNfts = args.length != 0 ? parseInt(args[0]) : 1;
    const nftCollection = await ELEN_E6883_NFT.deployed();
    const txn = await nftCollection.mintNFTs();
    console.log(txn);
  } catch(err) {
    console.log('Doh! ', getErrorMessage(err));
  }
}

module.exports = main;