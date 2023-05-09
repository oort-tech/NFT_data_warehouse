//SPDX-License-Identifier: MIT

const getErrorMessage = require("../scripts/getErrorMessage.js");
var ELEN_E6883_NFT = artifacts.require("./ELEN_E6883_NFT.sol");


const balanceOf = async (addr) => {
    try {
        const nftContract = await ELEN_E6883_NFT.deployed();
        const txn = await nftContract.getBalanceOf(addr);
        return txn;
    } catch(err) {
        console.log('Doh! ', getErrorMessage(err));
    }
}

module.exports = balanceOf;
