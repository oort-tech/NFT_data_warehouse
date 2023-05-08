// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _listedItems;
    Counters.Counter private _tokenIds;

    uint public listingPrice = 0.025 ether;

    // all tokenId array
    uint256[] private _allNfts;

    mapping(string => bool) private _usedTokenURIs;
    mapping(uint => NftItem) private _idToNftItem;
    mapping(uint => uint) private _idToNftIndex;

    //    mapping(address => mapping(uint => uint)) private _ownedTokens;

    mapping(address => mapping(uint => uint)) private _ownerToTokens;
    mapping(uint => uint) private _idToOwnedIndex;


    struct NftItem {
        uint tokenId;
        uint price;
        address creator;
        bool isListed;
    }

    event NftItemCreated (
        uint tokenId,
        uint price,
        address creator,
        bool isListed
    );

    constructor() ERC721("MNFT", "MNFT"){}

    function setListingPrice(uint newPrice) external onlyOwner {
        require(newPrice>0,"price must be at least 1 wei");
        listingPrice=newPrice;
    }

    function mintToken(string memory tokenURI, uint price) public payable returns (uint) {
        require(!tokenURIExists(tokenURI), "tokenURI already exists");
        require(msg.value == listingPrice, "Price must be equal to listing price");
        _tokenIds.increment();
        _listedItems.increment();

        uint newTokenId = _tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _usedTokenURIs[tokenURI] = true;

        createNftItem(newTokenId, price);

        return newTokenId;
    }

    function tokenURIExists(string memory tokenURI) public view returns (bool){
        return _usedTokenURIs[tokenURI] == true;
    }

    function createNftItem(uint tokenId, uint price) private {
        require(price > 0, "Price must be at least 1 wei");

        _idToNftItem[tokenId] = NftItem(tokenId, price, msg.sender, true);
        emit NftItemCreated(tokenId, price, msg.sender, true);
    }

    function getNftItem(uint tokenId) public view returns (NftItem memory) {
        return _idToNftItem[tokenId];
    }

    function listItemsCount() public view returns (uint) {
        return _listedItems.current();
    }

    function buyNft(uint tokenId) public payable {
        uint price = _idToNftItem[tokenId].price;
        address owner = ERC721.ownerOf(tokenId);

        require(msg.sender != owner, "You already own this NFT");
        require(msg.value == price, "Please submit the asking price");

        _idToNftItem[tokenId].isListed = false;
        _listedItems.decrement();

        _transfer(owner, msg.sender, tokenId);
        //give money to owner
        payable(owner).transfer(msg.value);
    }

    function placeNftOnSale(uint tokenId, uint newPrice) public payable {
        require(ERC721.ownerOf(tokenId)==msg.sender, "not owner of this nft");
        require(_idToNftItem[tokenId].isListed==false,"Item is already on sale");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _idToNftItem[tokenId].isListed = true;
        _idToNftItem[tokenId].price=newPrice;
        _listedItems.increment();
    }
    function placeNftUnSale(uint tokenId) public payable {
        require(ERC721.ownerOf(tokenId)==msg.sender, "not owner of this nft");
        require(_idToNftItem[tokenId].isListed==true,"Item is already unsale");

        _idToNftItem[tokenId].isListed = false;
        _listedItems.decrement();

    }

    function burnToken(uint tokenId) public {
        _burn(tokenId);
    }

    function totalSupply() public view returns (uint){
        return _allNfts.length;
    }

    function getTokenByIndex(uint index) public view returns (uint){
        require(index < totalSupply(), "Index out of bounds");
        return _allNfts[index];
    }

    function getOwnedTokensByOwner(address owner) public view returns (uint[] memory){
        uint length = ERC721.balanceOf(owner);
        uint[] memory tokens = new uint[](length);
        for (uint i = 0; i < length; i++) {
            tokens[i] = _ownerToTokens[owner][i];
        }
        return tokens;
    }

    function getNftByToken(uint tokenId) public view returns (NftItem memory){
        return _idToNftItem[tokenId];
    }

    function getAllNftOnSale() public view returns (NftItem[] memory){
        uint allItemCount = totalSupply();
        uint currentIndex = 0;
        NftItem[] memory items = new NftItem[](_listedItems.current());
        for (uint i = 0; i < allItemCount; i++) {
            uint tokenId = getTokenByIndex(i);
            NftItem memory item = _idToNftItem[tokenId];
            if (item.isListed) {
                items[currentIndex] = item;
                currentIndex++;
            }
        }
        return items;
    }

    function getAllNftByOwner() public view returns (NftItem[] memory){
        uint[] memory tokens = getOwnedTokensByOwner(msg.sender);
        uint length = tokens.length;
        NftItem[] memory items = new NftItem[](length);
        for (uint i = 0; i < length; i++) {

            items[i] = getNftByToken(tokens[i]);
        }
        return items;
    }

    //the function is provided by ERC721, and will be used when mint
    function _beforeTokenTransfer(address from, address to, uint tokenId, uint batchSize) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        // when mint a token, maintain the nft array and index
        if (from == address(0)) {
            _addTokenToAllTokensEnumeration(tokenId);
        } else if (from != to) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }
        // when burn a token
        if (to == address(0)) {
            _removeTokenFromAllTokensEnumeration(tokenId);
        } else if (to != from) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
    }

    function _addTokenToAllTokensEnumeration(uint tokenId) private {
        _idToNftIndex[tokenId] = _allNfts.length;
        _allNfts.push(tokenId);
    }

    function _addTokenToOwnerEnumeration(address to, uint tokenId) private {
        uint length = ERC721.balanceOf(to);
        _ownerToTokens[to][length] = tokenId;
        _idToOwnedIndex[tokenId] = length;
    }

    function _removeTokenFromOwnerEnumeration(address from, uint tokenId) private {
        uint lastTokenIndex = ERC721.balanceOf(from) - 1;
        uint targetTokenIndex = _idToOwnedIndex[tokenId];
        if (targetTokenIndex != lastTokenIndex) {
            uint lastTokenId = _ownerToTokens[from][lastTokenIndex];
            _ownerToTokens[from][targetTokenIndex] = lastTokenId;
            _idToOwnedIndex[lastTokenId] = targetTokenIndex;
        }
        delete _idToOwnedIndex[tokenId];
        delete _ownerToTokens[from][lastTokenIndex];
    }

    function _removeTokenFromAllTokensEnumeration(uint tokenId) private {
        uint lastTokenIndex = _allNfts.length - 1;
        uint targetTokenIndex = _idToNftIndex[tokenId];
        uint lastTokenId = _allNfts[lastTokenIndex];

        _allNfts[targetTokenIndex] = lastTokenId;
        _idToNftIndex[lastTokenId] = targetTokenIndex;

        delete _idToNftIndex[tokenId];
        _allNfts.pop();
    }


}
