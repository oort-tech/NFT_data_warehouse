//SPDX-License-Identifier: MIT

var ELEN_E6883_NFT = artifacts.require("./ELEN_E6883_NFT.sol");
const util = require('util')
const getErrorMessage = require("../scripts/getErrorMessage.js");


const setOwner = async (unique_id, newAddress) => {
    try {
        const nftContract = await ELEN_E6883_NFT.deployed();
        const txn = await nftContract.setOwner(unique_id, newAddress);
        return txn;
    } catch(err) {
        console.log('Doh! ', getErrorMessage(err));
    }
}

module.exports = setOwner;
