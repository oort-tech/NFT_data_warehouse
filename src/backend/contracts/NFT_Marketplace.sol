// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT_Marketplace is ERC721URIStorage {
    uint public tokenCount;
    uint public id_limit = 99999999;
    address payable public immutable feeAccount; // account receiving fees
    uint public immutable feePercent; // fee %  on sales 

    struct Item {
        uint tokenId;
        uint namedId;
        string name;
        string description;
        uint price;
        address payable owner;
        bool onsale;
    }   
    // itemId -> Item
    mapping(uint => Item) public items;

    // event when new NFT created
    event Created(
        uint indexed tokenId,
        uint indexed namedId,
        string name,
        string description,
        address indexed owner
    );

    // event when NFT put on sale
    event Offered(
        uint indexed tokenId,
        uint indexed namedId,
        string name,
        string description,
        address indexed owner,
        uint price
    );

    // event when NFT bought
    event Bought(
        uint indexed tokenId,
        uint namedId,
        string name,
        string description,
        address indexed owner,
        address indexed buyer,
        uint price
    );

    // event when NFT is recalled by the owner
    event Recalled(
        uint indexed tokenId,
        uint namedId,
        string name,
        string description,
        address indexed owner,
        uint price
    );

    // event when NFT is sent by the owner as a gift
    event Gift(
        uint indexed tokenId,
        uint namedId,
        string name,
        string description,
        address indexed sender,
        address receiver
    );


    // Constructor of the marketplace
    constructor(uint _feePercent) ERC721("DApp NFT_Marketplace", "DAPP"){
        // Market account
        feeAccount = payable(msg.sender);
        // fee%
        feePercent = _feePercent;
    }

    // Create new NFT item
    function createNFT(string memory _tokenURI, uint namedId, string memory name, string memory description) external returns(uint) {
        tokenCount ++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        // add new item to items mapping
        items[tokenCount] = Item (
            tokenCount,
            namedId,
            name,
            description,
            0,
            payable(msg.sender),
            false
        );
        Item storage item = items[tokenCount];
        // emit Created event
        emit Created(
            item.tokenId,
            item.namedId,
            item.name,
            item.description,
            item.owner
        );
        return(tokenCount);
    }

    // Put an NFT on sale
    function listNFTForSale(uint _tokenId, uint _price) external {
        require(_price > 0, "Price must be greater than zero");
        require(_tokenId > 0 && _tokenId <= tokenCount, "Invalid tokenId");
        Item storage item = items[_tokenId];
        require(item.owner == msg.sender, "Your address does not own this NFT");
        require(items[_tokenId].onsale == false, "This NFT is already on sale. Recall it first");
        require(ownerOf(_tokenId) == msg.sender, "ownerOf(_tokenId) fails");
        
        // add new item to items mapping
        item.price = _price;
        item.onsale = true;
        transferFrom(msg.sender, address(this), _tokenId);
        // emit Offered event
        emit Offered(
            item.tokenId,
            item.namedId,
            item.name,
            item.description,
            item.owner,
            item.price
        );
    }

    // Recall a saling NFT
    function removeNFTFromSale(uint _tokenId) public {
        require(_tokenId > 0 && _tokenId <= tokenCount, "Invalid tokenId");
        Item storage item = items[_tokenId];
        require(item.owner == msg.sender, "Your address does not own this NFT");
        require(items[_tokenId].onsale == true, "This NFT is already not on sale");

        items[_tokenId].onsale = false;
        this.transferFrom(address(this), msg.sender, _tokenId);
        // emit Recalled event
        emit Recalled(
            item.tokenId,
            item.namedId,
            item.name,
            item.description,
            item.owner,
            item.price
        );
    }

    // Transfer the ownership of an NFT
    function transferNFT(uint _tokenId, address receiver) public {
        require(_tokenId > 0 && _tokenId <= tokenCount, "Invalid tokenId");
        Item storage item = items[_tokenId];
        require(item.owner == msg.sender, "Your address does not own this NFT");
        require(items[_tokenId].onsale == false, "This NFT is already on sale. Recall it first");
        require(ownerOf(_tokenId) == msg.sender, "ownerOf(_tokenId) fails");

        transferFrom(msg.sender, receiver, _tokenId);
        items[_tokenId].owner = payable(ownerOf(_tokenId));
        // emit Gift event
        emit Gift(
            item.tokenId,
            item.namedId,
            item.name,
            item.description,
            msg.sender,
            item.owner
        );
    }

    function purchaseNFT(uint _tokenId) external payable{
        require(_tokenId > 0 && _tokenId <= tokenCount, "Invalid tokenId");
        Item storage item = items[_tokenId];
        uint _totalPrice = getTotalPrice(_tokenId);
        require(msg.value >= _totalPrice, "not enough ether to cover item price and market fee");
        require(item.onsale, "item already sold / not for sale");
        address org_owner = item.owner;
        // pay seller and feeAccount
        item.owner.transfer(item.price);
        feeAccount.transfer(_totalPrice - item.price);
        // update item to sold
        item.onsale = false;
        // transfer nft to buyer
        this.transferFrom(address(this), msg.sender, item.tokenId);
        item.owner = payable(ownerOf(item.tokenId));
        // emit Bought event
        emit Bought(
            item.tokenId,
            item.namedId,
            item.name,
            item.description,
            org_owner,
            item.owner,
            item.price
        );
    }

    function getTotalPrice(uint _itemId) view public returns(uint){
        return((items[_itemId].price*(100 + feePercent))/100);
    }

}