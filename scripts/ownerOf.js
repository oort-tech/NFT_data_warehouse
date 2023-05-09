//SPDX-License-Identifier: MIT

var ELEN_E6883_NFT = artifacts.require("./ELEN_E6883_NFT.sol");
const getErrorMessage = require("../scripts/getErrorMessage.js");

const ownerOf = async (unique_id) => {
    try {
        const nftContract = await ELEN_E6883_NFT.deployed();
        const txn = await nftContract.ownerOf(unique_id);
        return txn.toLowerCase();
    } catch(err) {
        console.log('Doh! ', getErrorMessage(err));
    }
}

module.exports = ownerOf;
