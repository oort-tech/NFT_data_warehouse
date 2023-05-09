// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CustomERC721 is ERC721URIStorage {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => uint256) private _tokenPrice;
    mapping(uint256 => bool) private _tokenOnSale;

    event NFTListed(uint256 indexed tokenId, uint256 price);
    event NFTUnlisted(uint256 indexed tokenId);

    constructor() ERC721("CustomERC721", "C721") {}

    function createNFT(uint256 id, string memory name, string memory description) public {
        address owner = msg.sender;
        require(owner != address(0), "Incorrect Address Info");
        require(!_exists(id), "ID already exists.");
        _tokenIdCounter.increment();
        _safeMint(owner, id);
        _setTokenURI(id, string(abi.encodePacked("data:application/json;base64,", name, ",", description)));
    }

    function transferNFT(address to, uint256 tokenId) public {
        address from = msg.sender;
        require(ownerOf(tokenId) == from, "Not the owner of the NFT.");
        require(to != address(0), "Cannot transfer to zero address.");
        require(from != to, "Cannot transfer to the same address");
        _transfer(from, to, tokenId);
    }

    function listNFTForSale(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of the NFT.");
        require(price > 0, "Price must be greater than zero.");
        _tokenPrice[tokenId] = price;
        _tokenOnSale[tokenId] = true;
        emit NFTListed(tokenId, price);
    }

    function removeNFTFromSale(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of the NFT.");
        require(_tokenOnSale[tokenId], "NFT is not on sale.");
        _tokenOnSale[tokenId] = false;
        emit NFTUnlisted(tokenId);
    }

    function showOnSaleNFTs() public view returns (uint256[] memory) {
        uint256 onSaleCounter = 0;
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_tokenOnSale[i]) {
                onSaleCounter++;
            }
        }

        uint256[] memory onSaleNFTs = new uint256[](onSaleCounter);
        uint256 index = 0;
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_tokenOnSale[i]) {
                onSaleNFTs[index] = i;
                index++;
            }
        }
        return onSaleNFTs;
    }

    function purchaseNFT(uint256 tokenId) public payable {
        require(_tokenOnSale[tokenId], "NFT is not on sale.");
        address seller = ownerOf(tokenId);
        address buyer = msg.sender;
        require(buyer.balance >= _tokenPrice[tokenId], "Buyer's ETH is not enough.");
        require(buyer != address(0), "Cannot transfer to zero address.");
        _transfer(seller, buyer, tokenId);

        if (msg.value > _tokenPrice[tokenId]) {
            payable(buyer).transfer(msg.value.sub(_tokenPrice[tokenId]));
        }
        payable(seller).transfer(_tokenPrice[tokenId]);

        _tokenOnSale[tokenId] = false;
        _tokenPrice[tokenId] = 0;
    }

    function getTokenPrice(uint256 tokenId) public view returns (uint256) {
        return _tokenPrice[tokenId];
    }

    function isTokenOnSale(uint256 tokenId) public view returns (bool) {
        return _tokenOnSale[tokenId];
    }
}
