// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MyNFT is ERC721, ERC721URIStorage {
    uint256 private _currentTokenId = 0;

    struct NFTDetails {
        string name;
        string description;
    }

    mapping(uint256 => NFTDetails) public nftDetails;
    mapping(uint256 => uint256) public nftSalePrices;

    constructor() ERC721("MyNFT", "MNFT") {}

    function createNFT(address recipient, string memory name, string memory description) public {
        uint256 newTokenId = _currentTokenId;
        string memory tokenURI = string(abi.encodePacked("https://example.com/token/", uint2str(newTokenId)));

        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        nftDetails[newTokenId] = NFTDetails(name, description);
        _currentTokenId++;
    }

    function uint2str(uint256 _i) private pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len - 1;
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }

    function listNFTForSale(uint256 tokenId, uint256 salePrice) public {
        require(_exists(tokenId), "Token ID not exist");
        require(ownerOf(tokenId) == msg.sender, "Caller is not the owner");
        nftSalePrices[tokenId] = salePrice;
    }

    function removeNFTFromSale(uint256 tokenId) public {
        require(_exists(tokenId), "Token ID not exist");
        require(ownerOf(tokenId) == msg.sender, "Caller is not the owner");
        nftSalePrices[tokenId] = 0;
}

    function purchaseNFT(uint256 tokenId) public payable {
        require(_exists(tokenId), "Token ID not exist");
        uint256 salePrice = nftSalePrices[tokenId];
        require(salePrice > 0, "NFT is not for sale");
        require(msg.value == salePrice, "Incorrect Ether amount");

        address seller = ownerOf(tokenId);

        _transfer(seller, msg.sender, tokenId);
        nftSalePrices[tokenId] = 0;
        payable(seller).transfer(msg.value);
        require(msg.value == salePrice, "Incorrect amount, purchase failed");
}
    
    //Modify the tokenURI function and _burn funtion to avoid conflict with ERC721URIStrorage
    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return ERC721URIStorage.tokenURI(tokenId);
    }
    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        return ERC721URIStorage._burn(tokenId);
    }
}


