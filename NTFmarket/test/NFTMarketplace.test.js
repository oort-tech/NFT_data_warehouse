const NFTMarketplace = artifacts.require("NFTMarketplace");
const truffleAssert = require("truffle-assertions");
// const Web3 = require('web3');
// const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
contract("NFTMarketplace", (accounts) => {

    let _contract;
    let _nftPrice = web3.utils.toWei("13.25", "ether");
    let _listingPrice = web3.utils.toWei("0.025", "ether");
    console.log(typeof _listingPrice)
    console.log(typeof _nftPrice)

    before(async () => {
        _contract = await NFTMarketplace.deployed();
        // console.log(accounts)
    })

    describe("Mint token", () => {
        const tokenURI = "https://test.com";
        const tokenURI2 = "http://wrong.com";
        before(async () => {
            await _contract.mintToken(tokenURI, _nftPrice, {
                from: accounts[0],
                value: _listingPrice
            });
            await _contract.mintToken(tokenURI2, _nftPrice, {
                from: accounts[0],
                value: _listingPrice
            });
        })
        it('owner of first token should be address[0]', async function () {
            const owner = await _contract.ownerOf(1);
            assert.equal(owner, accounts[0], "owner of first token is not address[0] ");
        });
        it('first token id should point to correct tokenURI ', async function () {
            const actualTokenURI = await _contract.tokenURI(1);
            assert.equal(tokenURI, actualTokenURI, "tokenURI is not matching");
        });
        it('should not be possible to create a NFT with used tokenURI', async function () {
            // try {
            //     await _contract.minToken(tokenURI,{from:accounts[0]});
            // }catch (e){
            //     assert(e,"NFT was minted with previously used tokenURI");
            // }
            await truffleAssert.fails(
                    _contract.mintToken(tokenURI, _nftPrice, {from: accounts[0], value: _listingPrice}),
                    truffleAssert.ErrorType.REVERT,
                    "tokenURI already exists"
            );
        });
        it('should have create NFT item', async function () {
            const NftItem = await _contract.getNftItem(1);
            assert.equal(NftItem.tokenId, 1, "wrong token id");
            assert.equal(NftItem.price, _nftPrice, "wrong price");
            assert.equal(NftItem.creator, accounts[0], "wrong creator");
            assert.equal(NftItem.isListed, true, "wrong show status");
        });
    })

    describe("Buy NFT", () => {
        before(async () => {
            await _contract.buyNft(1, {
                from: accounts[1],
                value: _nftPrice
            })
        })
        it('should unlist the item', async function () {
            const buyItem = await _contract.getNftItem(1);
            assert.equal(buyItem.isListed, false, "wrong show status");
        });
        it('should decrease listed item count', async function () {
            const listItemCount = await _contract.listItemsCount();
            assert.equal(listItemCount, 1, "wrong listed item count");
        });
        it('should change owner', async function () {
            const currentOwner = await _contract.ownerOf(1);
            assert.equal(currentOwner, accounts[1], "wrong listed item count");
        });
        it('should not change owner if buy owned item',async function () {
            try{
                await _contract.buyNft(2, {
                    from: accounts[1],
                    value: web3.utils.toWei("13", "ether")
                });
            }catch (e) {
                const currentOwner = await _contract.ownerOf(2);
                assert.equal(currentOwner, accounts[0], "wrong listed item count");
            }
        });

    });

    describe("list all Nft on sale", () => {
        before(async () => {
            // let _nftPrice = web3.utils.toWei("13.25","ether");
            await _contract.mintToken("http://baidu.com", web3.utils.toWei("10", "ether"), {
                from: accounts[2],
                value: _listingPrice
            });
            await _contract.mintToken("http://tencent.com", web3.utils.toWei("20", "ether"), {
                from: accounts[2],
                value: _listingPrice
            });
            await _contract.mintToken("http://taobao.com", web3.utils.toWei("30", "ether"), {
                from: accounts[2],
                value: _listingPrice
            });
        })
        it('should list all Nft on sale', async function () {
            const NftItemList = await _contract.getAllNftOnSale();
            // console.log(NftItemList);
            assert.equal(NftItemList[0].tokenId, 2, "wrong Nft list");
        });
    });

    describe("list owned Nfts by owner", () => {
        before(async () => {
            // let _nftPrice = web3.utils.toWei("13.25","ether");
            await _contract.mintToken("http://111.com", web3.utils.toWei("10", "ether"), {
                from: accounts[3],
                value: _listingPrice
            });
            await _contract.mintToken("http://222.com", web3.utils.toWei("20", "ether"), {
                from: accounts[3],
                value: _listingPrice
            });
        })
        it('should list all owned Nfts', async function () {
            const ownedItem = await _contract.getAllNftByOwner({from: accounts[3]});
            // console.log(ownedItem);
            assert.equal(ownedItem.length, 2, "owned item length doesn't match");
        });
    })
    describe("burn token", () => {
        before(async () => {
            // let _nftPrice = web3.utils.toWei("13.25","ether");
            await _contract.mintToken("http://bbc.com", web3.utils.toWei("4.1", "ether"), {
                from: accounts[4],
                value: _listingPrice
            });
            await _contract.mintToken("http://abc.com", web3.utils.toWei("4.2", "ether"), {
                from: accounts[4],
                value: _listingPrice
            });
        })
        it('should have 2 token for current account 4', async function () {
            const items = await _contract.getAllNftByOwner({from: accounts[4]});
            assert.equal(items.length, 2, "wrong item number");
        });
        it('should only have 1 token after burn', async function () {
            const items = await _contract.getAllNftByOwner({from: accounts[4]});
            await _contract.burnToken(items[0].tokenId);
            const currentItemNumber1 = await _contract.balanceOf(accounts[4]);
            assert.equal(currentItemNumber1, 1, "wrong number after burn token");
            const currentItemNumber2 = await _contract.getAllNftByOwner({from: accounts[4]});
            assert.equal(currentItemNumber2.length, 1, "wrong item number after burn token");
        });
    })
})