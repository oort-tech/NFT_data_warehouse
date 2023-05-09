// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {
  using Counters for Counters.Counter;
  Counters.Counter private _nftsSold;
  Counters.Counter private _nftCount;
  uint256 public LISTING_FEE = 0 ether;
  address payable private _marketOwner;
  mapping(uint256 => NFT) private _idToNFT;
  struct NFT {
    address nftContract;
    uint256 tokenId;
    address payable seller;
    address payable owner;
    uint256 price;
    bool listed;
  }
  event NFTListed(
    address nftContract,
    uint256 tokenId,
    address seller,
    address owner,
    uint256 price
  );
  event NFTSold(
    address nftContract,
    uint256 tokenId,
    address seller,
    address owner,
    uint256 price
  );

    event Received(address Sender, uint Value);

  constructor() {
    _marketOwner = payable(msg.sender);
  }


  receive() external payable{
       emit Received(msg.sender, msg.value);
  }
  
  
  function getBalance() view public returns(uint) {
        return address(this).balance;
  }

  function transferETH(address payable _to, uint256 amount) external payable{
    _to.transfer(amount);
  } 

  function withdraw() public payable {
      require(msg.sender == _marketOwner, "You are not the owner of this Market");
      _marketOwner.transfer(address(this).balance);
  }

  // List the NFT on the marketplace
  function listNft(address _nftContract, uint256 _tokenId, uint256 _price) public payable nonReentrant {
    require(_price > 0, "Price must be at least 1 wei");
    require(msg.value >= LISTING_FEE, "Not enough ether for listing fee");

    IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

    // address(this).call{value: LISTING_FEE}("");
    _marketOwner.transfer(LISTING_FEE);
    // 退款多余的LISTING_FEE
    // msg.sender.call{value: msg.value - LISTING_FEE}("");

    _nftCount.increment();

    _idToNFT[_tokenId] = NFT(
      _nftContract,
      _tokenId, 
      payable(msg.sender),
      payable(address(this)),
      _price,
      true
    );

    emit NFTListed(_nftContract, _tokenId, msg.sender, address(this), _price);
  }

  // Buy an NFT
  function buyNft(address _nftContract, uint256 _tokenId) public payable nonReentrant {
    NFT storage nft = _idToNFT[_tokenId];
    require(msg.value >= nft.price, "Not right ether to cover asking price");

    address payable buyer = payable(msg.sender);

    // nft.seller.call{value: nft.price}("");
    // msg.sender.call{value: msg.value - nft.price}("");

    payable(nft.seller).transfer(msg.value);

    IERC721(_nftContract).transferFrom(address(this), buyer, nft.tokenId);
    nft.owner = buyer;
    nft.listed = false;

    _nftsSold.increment();
    emit NFTSold(_nftContract, nft.tokenId, nft.seller, buyer, msg.value);
  }

  // Resell an NFT purchased from the marketplace
  function resellNft(address _nftContract, uint256 _tokenId, uint256 _price) public payable nonReentrant {
    require(_price > 0, "Price must be at least 1 wei");
    require(msg.value == LISTING_FEE, "Not enough ether for listing fee");

    IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

    NFT storage nft = _idToNFT[_tokenId];
    nft.seller = payable(msg.sender);
    nft.owner = payable(address(this));
    nft.listed = true;
    nft.price = _price;

    _nftsSold.decrement();
    emit NFTListed(_nftContract, _tokenId, msg.sender, address(this), _price);
  }

  function removeItem(uint i) public{
    delete _idToNFT[i];
  }

  function removeNFTFromSale(address _nftContract, uint256 _tokenId) public returns(NFT[] memory){
    NFT[] memory nfts_ = getMySpecificListedNft(_nftContract, _tokenId);
    // NFT[] memory nfts = new NFT[](1);
    require(nfts_[0].seller == msg.sender, "Must be NFT seller");
    
    uint nftCount = _nftCount.current();
    for (uint i = 0; i < nftCount; i++) {
      if (_idToNFT[i + 1].seller == msg.sender && _idToNFT[i + 1].listed && _idToNFT[i + 1].nftContract == _nftContract && _idToNFT[i + 1].tokenId == _tokenId) {
        _idToNFT[i + 1].listed = false;
      }
    }
    return nfts_;
  }


  function getListedNfts() public view returns (NFT[] memory) {
    uint256 nftCount = _nftCount.current();
    uint256 unsoldNftsCount = nftCount - _nftsSold.current();

    NFT[] memory nfts = new NFT[](unsoldNftsCount);
    uint nftsIndex = 0;
    for (uint i = 0; i < nftCount; i++) {
      if (_idToNFT[i + 1].listed) {
        nfts[nftsIndex] = _idToNFT[i + 1];
        nftsIndex++;
      }
    }
    return nfts;
  }

  function getMyNfts() public view returns (NFT[] memory) {
    uint nftCount = _nftCount.current();
    uint myNftCount = 0;
    for (uint i = 0; i < nftCount; i++) {
      if (_idToNFT[i + 1].owner == msg.sender) {
        myNftCount++;
      }
    }

    NFT[] memory nfts = new NFT[](myNftCount);
    uint nftsIndex = 0;
    for (uint i = 0; i < nftCount; i++) {
      if (_idToNFT[i + 1].owner == msg.sender) {
        nfts[nftsIndex] = _idToNFT[i + 1];
        nftsIndex++;
      }
    }
    return nfts;
  }

  function getMyListedNfts() public view returns (NFT[] memory) {
    uint nftCount = _nftCount.current();
    uint myListedNftCount = 0;
    for (uint i = 0; i < nftCount; i++) {
      if (_idToNFT[i + 1].seller == msg.sender && _idToNFT[i + 1].listed) {
        myListedNftCount++;
      }
    }

    NFT[] memory nfts = new NFT[](myListedNftCount);
    uint nftsIndex = 0;
    for (uint i = 0; i < nftCount; i++) {
      if (_idToNFT[i + 1].seller == msg.sender && _idToNFT[i + 1].listed) {
        nfts[nftsIndex] = _idToNFT[i + 1];
        nftsIndex++;
      }
    }
    return nfts;
  }

  function getMySpecificListedNft(address _nftContract, uint256 _tokenId) public view returns(NFT[] memory) {
    uint nftCount = _nftCount.current();
    NFT[] memory nfts = new NFT[](1);

    for (uint i = 0; i < nftCount; i++) {
      if (_idToNFT[i + 1].seller == msg.sender && _idToNFT[i + 1].listed && _idToNFT[i + 1].nftContract == _nftContract && _idToNFT[i + 1].tokenId == _tokenId) {
        nfts[0] = _idToNFT[i + 1];
      }
    }
    return nfts;
  }
}
