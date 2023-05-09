//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract ELEN_E6883_NFT is ERC721URIStorage, Ownable {

    using SafeMath for uint256;
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;
    // The max number of NFTs in the collection
    uint public constant MAX_SUPPLY = 100;
    // The mint price for the collection
    uint public constant PRICE = 0.00001 ether;
    // The max number of mints per wallet
    uint public constant MAX_PER_MINT = 5;
    string public baseTokenURI;

    //*** VK added code #1***
    struct Listing {
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    address public _contractOwner;
    uint256 public _price;
    IERC721 public nftContract;
    mapping (uint256 => Listing) public Listings;

    event listingCreated(address seller, uint256 tokenId, uint256 price);
    event SaleCancelled(address seller, uint256 tokenId);
    event SaleSuccessful(address buyer, uint256 tokenId, uint256 price);
    event nftdetails(uint256 tokenId, address owner);
    //*** VK end code #1 ***

    constructor(string memory baseURI, string memory name, string memory symbol) ERC721(name, symbol) {
        setBaseURI(baseURI);
        _contractOwner = msg.sender;
    }


    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory _baseTokenURI) public onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

    function mintNFTs(uint _count) public payable {
        uint totalMinted = _tokenIds.current();

        require(totalMinted.add(_count) <= MAX_SUPPLY, "This collection is sold out!");
        require(_count >0 && _count <= MAX_PER_MINT, "You have received the maximum amount of NFTs allowed.");
        require(msg.value >= PRICE.mul(_count), "Not enough ether to purchase NFTs.");

        for (uint i = 0; i < _count; i++) {
            _mintSingleNFT();
        }
    }

    function _mintSingleNFT() private {
        uint newTokenID = _tokenIds.current();
        _safeMint(msg.sender, newTokenID);
        _tokenIds.increment();
    }

    function createNFT(uint256 newTokenID, string memory data) public {
        _safeMint(msg.sender, newTokenID);
        _setTokenURI(newTokenID, data);

        Listing memory listing = Listing({
            tokenId: newTokenID,
            price: 0,
            active: false
        });

        Listings[newTokenID] = listing;

        emit nftdetails(newTokenID, msg.sender);
    }

    // Withdraw the ether in the contract
    function withdraw() public payable onlyOwner {
        uint balance = address(this).balance;
        require(balance > 0, "No ether left to withdraw");

        (bool success, ) = (msg.sender).call{value: balance}("");
        require(success, "Transfer failed.");
    }

    // Reserve NFTs only for owner to mint for free
    function reserveNFTs(uint _count) public onlyOwner {
        uint totalMinted = _tokenIds.current();

        require(totalMinted.add(_count) < MAX_SUPPLY, "Not enough NFTs left to reserve");

        for (uint i = 0; i < _count; i++) {
            _mintSingleNFT();
        }
    }

    // Transfer ownership of an NFT to a new address
    function transferNFTOwnership(uint256 tokenId, address newOwner) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller is not the owner or approved for this token");
        require(newOwner != address(0), "Invalid recipient address");
        require(_exists(tokenId), "Token ID does not exist");

        _safeTransfer(msg.sender, newOwner, tokenId, "");
    }

    function listNFTForSale(uint256 tokenId, uint256 price) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller is not the owner or approved for this token");
        require(price > 0, "Price must be greater than zero");
        require(Listings[tokenId].active == false, "Token already listed for sale");

        Listings[tokenId].price = price;
        Listings[tokenId].active = true;
        emit listingCreated(msg.sender, tokenId, Listings[tokenId].price);
    }

    function getPrice(uint256 tokenId) public view virtual returns (uint256) {
        require(Listings[tokenId].active == true, "Sale already cancelled");
        return Listings[tokenId].price;
    }

    function removeNFTFromSale(uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller is not the owner or approved for this token");
        require(Listings[tokenId].active == true, "Sale already cancelled");

        Listings[tokenId].active = false;
        emit SaleCancelled(msg.sender, tokenId);
    }

    function isNFTForSale(uint256 tokenId) public view virtual returns (bool) {
        return Listings[tokenId].active;
    }

    function getBalanceOf(address addr) public view virtual returns (uint256) {
        return addr.balance;
    }

// Buy an NFT
    function purchaseNFT(uint256 tokenId) public payable {
        require(_exists(tokenId), "Token ID does not exist");
        require(msg.value >= Listings[tokenId].price, "Not enough ether to cover asking price");

        address seller = ownerOf(tokenId);
        emit SaleSuccessful(seller, tokenId, 1);
        address payable buyer = payable(msg.sender);
        emit SaleSuccessful(buyer, tokenId, 1);
        payable(seller).transfer(msg.value);
        _safeTransfer(seller, buyer, tokenId, "");
        Listings[tokenId].active = false;

        emit SaleSuccessful(buyer, tokenId, msg.value);
    }

    //*** VK end code #2 ***
}