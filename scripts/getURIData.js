//SPDX-License-Identifier: MIT

var ELEN_E6883_NFT = artifacts.require("./ELEN_E6883_NFT.sol");
const getErrorMessage = require("../scripts/getErrorMessage.js");


const getURIData = async (token_id) => {
    try {
        const nftContract = await ELEN_E6883_NFT.deployed();
        const txn = await nftContract.tokenURI(token_id);
        return txn;
    } catch(err) {
        console.log('get URI Doh! ', getErrorMessage(err));
    }
}

module.exports = getURIData;
