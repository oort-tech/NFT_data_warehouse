// SPDX-License-Identifier: MIT
// Tells the Solidity compiler to compile only from v0.8.13 to v0.9.0

pragma solidity ^0.8.13;

// If you do not have these dependences, you need download them "npm install @openzeppelin/contracts" in your terminal
// and you need to modify the import path according to your path

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ERC721URIStorage, Ownable {
    
    //event createNFT(address indexed sender, string name, string message);

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    
    struct NFT {
        //id, name, description需要用于test.case
        uint256 id;
        address owner;
        uint256 price;
        string name;
        bool isForSale;
        string description;
        bool couldSale;
    
    }

   
    mapping(uint256 => NFT) public nfts;
    // use to map itenid and tokenId
    mapping(uint256 => uint256) public IdToTokenId;


    constructor() ERC721("NFTMarketplace", "NFTM") {}


    
    function createNFT(uint256 id, string memory name, string memory description) public {

    
        require(IdToTokenId[id] == 0, "NFT with this ID already exists");


        _tokenIds.increment();
        uint256 newNFTId = _tokenIds.current();

        _safeMint(msg.sender, newNFTId);

        _setTokenURI(newNFTId, description);

        //add to mapping
        nfts[newNFTId] = NFT(id, msg.sender, 0, name, false, description,true);
        IdToTokenId[id] = newNFTId;


        //emit createNFT(msg.sender, name, description);


        // require(nfts[newNFTId].id == id, "Failed to create NFT");
        //require(keccak256(abi.encodePacked(nfts[newNFTId].name)) == keccak256(abi.encodePacked(name)), "Failed to set NFT name");
        //require(keccak256(abi.encodePacked(nfts[newNFTId].description)) == keccak256(abi.encodePacked(description)), "Failed to set NFT description");
    }



   
   
    function getNFT(uint256 id) public view returns(NFT memory){
    
        uint256 tokenId = IdToTokenId[id];
        return nfts[tokenId];
    }
    

    function gettokenID(uint256 id) public view returns(uint256){
    
        uint256 tokenId = IdToTokenId[id];
        return tokenId;
        
    }

    

    
    function transferNFT(address to, uint256 id) public {
    
        // require(IdToTokenId[id] != 0, "NFT with this ID does not exists");
        uint256 tokenId=IdToTokenId[id];

        require(_exists(tokenId),"NFT does not exit, please check your NFT id");


        // require(nfts[tokenId].owner == msg.sender, "You do not own this NFT, please recheck");
        require(ownerOf(tokenId) == msg.sender, "You do not own this NFT, please recheck");

        safeTransferFrom(msg.sender, to, tokenId);


        require(ownerOf(tokenId) == to, "Failed to transfer NFT ownership");

}

   function listNFTForSale(uint256 id, uint256 price) public {

    
        uint256 tokenId=IdToTokenId[id];

        require(_exists(tokenId), "NFT does not exist");
        require(nfts[tokenId].couldSale==true,"NFT is no longer listed for sale as you have removed");
        require(msg.sender == ownerOf(tokenId), "Only the owner can list the NFT for sale");
        require(price > 0, "Price must be greater than zero");

        // Approve the contract to manage the NFT
        _approve(address(this), tokenId);

        nfts[tokenId].price = price;
        nfts[tokenId].isForSale = true;
        
}

  function removeNFTFromSale(uint256 id) public {
    
    uint256 tokenId=IdToTokenId[id];
    
    require(_exists(tokenId), "NFT does not exist");
    require(nfts[tokenId].isForSale==true,"NFT is not for sale");
    require(ownerOf(tokenId) == msg.sender, "Only the owner can remove their NFT from sale");

    nfts[tokenId].isForSale = false;
    nfts[tokenId].price = 0;
    nfts[tokenId].couldSale=false;
}



function purchaseNFT(uint256 id) public payable {
    uint256 tokenId = IdToTokenId[id];

    require(_exists(tokenId), "NFT does not exist");
    
    require(nfts[tokenId].couldSale==true,"NFT is no longer listed for sale as you have removed");
    require(nfts[tokenId].isForSale, "NFT is not for sale");

    
    require(nfts[tokenId].owner!= msg.sender, "NFT do not to buy, as you are owner");
    
    
    uint256 salePrice = nfts[tokenId].price;


    require(msg.value >= salePrice, "Insufficient Ether to purchase NFT");

   
    // address owner = ownerOf(tokenId);
    // //require(owner == msg.sender || getApproved(tokenId) == msg.sender || isApprovedForAll(owner, msg.sender), "Purchase not authorized");

   
    // if (owner != msg.sender && getApproved(tokenId) != msg.sender && !isApprovedForAll(owner, msg.sender)) {
    //     approve(msg.sender, tokenId);
    // }


   
    address previousOwner = ownerOf(tokenId);
    safeTransferFrom(previousOwner, msg.sender, tokenId);

   
    nfts[tokenId].isForSale = false;
    nfts[tokenId].price = 0;

    
    payable(previousOwner).transfer(salePrice);

    // return the remaining money back
    uint256 refund = msg.value - salePrice;
    if (refund > 0) {
        payable(msg.sender).transfer(refund);
    }

   
}

    
}



