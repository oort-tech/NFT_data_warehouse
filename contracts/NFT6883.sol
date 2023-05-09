// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT6883 is ERC721URIStorage, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  address marketplaceContract;
  event NFTMinted(uint256);
  //address owner;

  constructor(address _marketplaceContract) ERC721("6883NFTMarketPlaceCard", "6883") {
    marketplaceContract = _marketplaceContract;
    //owner = msg.sender;
  }

  function changeMarket(address _marketplaceContract) public onlyOwner{
    marketplaceContract = _marketplaceContract; 
  }

  function MarketplaceAddress() external view returns(address marketplaceContract_) {
        marketplaceContract_ = marketplaceContract;
    }
    
  // Our Token ID is increase in order
  function mint(string memory name, string memory description) public {
    _tokenIds.increment();
    uint256 newTokenId = _tokenIds.current();
    _safeMint(msg.sender, newTokenId);
    _setTokenURI(newTokenId, string(abi.encodePacked(name, ",", description)));
    setApprovalForAll(marketplaceContract, true);
    emit NFTMinted(newTokenId);
  }

  function NameandDescription(uint256 tokenid) public view returns(string memory) {
    return tokenURI(tokenid);
  }
}
