//SPDX-License-Identifier: MIT

var ELEN_E6883_NFT = artifacts.require("./ELEN_E6883_NFT.sol");
const getErrorMessage = require("../scripts/getErrorMessage.js");


const removeNFTFromSale = async (unique_id, price) => {
    try {
        const nftContract = await ELEN_E6883_NFT.deployed();
        const txn = await nftContract.removeNFTFromSale(unique_id);
        return txn;
    } catch(err) {
        console.log('Doh! ', getErrorMessage(err));
    }
}

module.exports = removeNFTFromSale;
