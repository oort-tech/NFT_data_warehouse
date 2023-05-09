//SPDX-License-Identifier: MIT

const BN = require('bn.js');

const balanceOf = require("../scripts/balanceOf.js");
const createNFT = require("../scripts/createNFT.js");
const getPrice = require("../scripts/getPrice.js");
const getURIData = require("../scripts/getURIData.js");
const isNFTForSale = require("../scripts/isNFTForSale.js");
const listNFTForSale = require("../scripts/listNFTForSale.js");
const ownerOf = require("../scripts/ownerOf.js");
const removeNFTFromSale = require("../scripts/removeNFTFromSale.js");
const transferNFT = require("../scripts/transferNFT.js");

const ELEN_E6883_NFT = artifacts.require("./ELEN_E6883_NFT.sol");

contract("ELEN_E6883_NFT", function (accounts) {
    it("TC1: create a NFT with unique ID", async () => {
        const name = "Test NFT #1";
        const desc = "This is a test NFT description for test case 1";

        const txnData = await createNFT(1216, name, desc);
        const dataURI = await getURIData(1216);

        const jsonObj = Buffer.from(dataURI.substring(29), "base64").toString("utf8");
        const result = JSON.parse(jsonObj);

        assert.equal(name, result.name, "The name was not stored.");
        assert.equal(desc, result.description, "The description was not stored.");
    });

    //*** VK added code #3 ***
    it("TC2: transfer ownership to another account", async () => {
        const name = "Test NFT #2";
        const desc = "This is a test NFT description for test case 2";

        const tokenID = await createNFT(1217, name, desc);
        await transferNFT(1217, accounts[1]);

        const currOwner = await ownerOf(1217);
        assert.equal(currOwner, accounts[1].toLowerCase(), "The owners should be the same.");
    });
    
    it("TC3: List NFT for sale", async () => {
        const name = "Test NFT #3";
        const desc = "This is a test NFT description for test case 3";

        const tokenID = await createNFT(1218, name, desc);
        await listNFTForSale(1218, 31415);

        const price = await getPrice(1218);
        assert.equal(price, 31415, "The price does not match.");
    });
    
    it("TC4: Remove the NFT from the sale", async () => {
        const name = "Test NFT #4";
        const desc = "This is a test NFT description for test case 4";
        const price = 31415;

        const tokenID = await createNFT(1219, name, desc);
        await listNFTForSale(1219, price);
        await removeNFTFromSale(1219);

        assert.equal(await isNFTForSale(1219), false, "The NFT is still for sale.");
    });
    
    it("TC5: Purchase the NFT from a seller", async () => {
        const name = "Test NFT #5";
        const desc = "This is a test NFT description for test case 5";
        let price = 1000000;  // 1000000wei

        const tokenID = await createNFT(1220, name, desc);
        await listNFTForSale(1220, price);

        //  Here we make a custom call to the purchase NFT to test the contract
        //  the JS code can be exercised elsewhere
        const nftContract = await ELEN_E6883_NFT.deployed();
        var account0_balance_old = await balanceOf(accounts[0]);
        const txn = await nftContract.purchaseNFT(1220, {from : accounts[1], value : price});
        var account0_balance_new = await balanceOf(accounts[0]);

        const currOwner = await ownerOf(1220);

        assert.equal(account0_balance_old.add(new BN(price)).toString(), account0_balance_new.toString(), "The buyers's account balance is incorrect");
        assert.equal(currOwner, accounts[1].toLowerCase(), "The owners should be the same.");
    });

    it("TC6: Fail to purchase the NFT from a seller", async () => {
        const name = "Test NFT #5";
        const desc = "This is a test NFT description for test case 5";
        let price = 1000000;  // 1000000wei

        const tokenID = await createNFT(1221, name, desc);
        await listNFTForSale(1221, price);

        var account0_balance_old = await balanceOf(accounts[0]);

        try {
            //  Here we make a custom call to the purchase NFT to test the contract
            //  the JS code can be exercised elsewhere
            const nftContract = await ELEN_E6883_NFT.deployed();
            const txn = await nftContract.purchaseNFT(1221, {from: accounts[1], value: price - 1});
        } catch(err) {
            // Gracefully do nothing
        }
        var account0_balance_new = await balanceOf(accounts[0]);

        const currOwner = await ownerOf(1221);
        assert.equal(account0_balance_old.toString(), account0_balance_new.toString(), "The buyers's account balance is incorrect");
        assert.equal(currOwner, accounts[0].toLowerCase(), "The owners should be the same.");
    });
    //*** VK end code #3 ***    
});