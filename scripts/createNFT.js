//SPDX-License-Identifier: MIT

var ELEN_E6883_NFT = artifacts.require("./ELEN_E6883_NFT.sol");
const util = require('util')
const getErrorMessage = require("../scripts/getErrorMessage.js");

const createNFT = async (unique_id, name, description) => {
    try {
        const nftObject =  "data:application/json;base64," + Buffer.from(JSON.stringify({name : name, description : description})).toString("base64");
        const nftContract = await ELEN_E6883_NFT.deployed();
        const txn = await nftContract.createNFT(unique_id, nftObject);
        return txn;
    } catch(err) {
        console.log('Doh! ', getErrorMessage(err));
    }
}

module.exports = createNFT;
