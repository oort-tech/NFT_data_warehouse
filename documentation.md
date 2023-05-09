# Documentation

This documentation focuses on the contracts part, including NFT6883 Contract and Marketplace Contract.

## NFT6883 Contract

This contract is an implementation of an ERC721 Non-Fungible Token (NFT) with URI storage. It is used to create and manage unique digital assets that can be owned, transferred and sold on a blockchain network.

### Contract Details

#### Dependencies

This contract requires the following dependencies:

OpenZeppelin `ERC721`, `ERC721URIStorage`, `Counters`, and `Ownable` contracts.

#### Variables

NFT6883 has the following variables:

`marketplaceContract`: an address variable that represents the address of the marketplace contract.

`_tokenIds`: a `Counter` variable from the `Counters` library used to keep track of token IDs.

#### Events

NFT6883 emits the following event:

`NFTMinted`: emitted when a new NFT is minted. Takes one parameter, the `newTokenId` of the newly minted NFT.

#### Functions

NFT6883 has the following functions:

`constructor`: a constructor function that sets the marketplace contract address and calls the `ERC721` constructor with the token name and symbol.

`changeMarket`: a function that allows the contract owner to change the address of the marketplace contract.

`MarketplaceAddress`: a view function that returns the address of the marketplace contract.

`mint`: a function that mints a new NFT and sets its name and description. It takes two string parameters, `name` and `description`, and emits the `NFTMinted` event.

`NameandDescription`: a view function that returns the name and description of an NFT with a given tokenId.


### Contract Usage

The NFT6883 contract can be used to mint ERC721 NFTs on a blockchain network.

#### Minting an NFT

To mint an NFT, use the mint function. The function takes two arguments: the name and the description of the NFT. The function will increment the NFT counter, assign a new ID to the NFT, mint the NFT, set the token URI, and set the marketplace contract as an approved operator for the NFT.

#### Changing the Marketplace Address

To change the address of the marketplace contract, use the changeMarket function. The function takes one argument: the new address of the marketplace contract. The function can only be called by the contract owner.

#### Retrieving NFT Name and Description

To retrieve the name and description of an NFT, use the NameandDescription function. The function takes one argument: the token ID of the NFT. The function returns the token URI of the NFT, which contains the name and description of the NFT.

#### Retrieving Marketplace Address

To retrieve the address of the marketplace contract, use the MarketplaceAddress function. The function returns the address of the marketplace contract.

## Marketplace Contract

This contract is a marketplace for buying and selling ERC721 Non-Fungible Tokens (NFTs) on a blockchain network. It implements functions for listing NFTs for sale, buying NFTs, reselling NFTs, and retrieving NFTs owned by a user.

### Contract Details

#### Contract Name
Marketplace

#### Solidity Version
The smart contract is written in Solidity version 0.8.13.

#### Libraries
This contract uses two libraries:

`Counters` for counting the number of NFTs sold and the number of NFTs listed.

`ERC721` for implementing the `ERC721` token standard for NFTs.

#### Inheritance
This contract inherits from `ReentrancyGuard` which is used to prevent reentrant calls.

#### State Variables
The contract has the following state variables:

`_nftsSold` (Counter): used for counting the number of NFTs sold.

`_nftCount` (Counter): used for counting the number of NFTs listed.

`LISTING_FEE` (uint256): the fee required for listing an NFT on the marketplace.

`_marketOwner` (address payable): the owner of the marketplace.

`_idToNFT` (mapping): a mapping from NFT IDs to NFT objects.

#### Events

The contract emits the following events:

`NFTListed`: when an NFT is listed on the marketplace.

`NFTSold`: when an NFT is sold on the marketplace.

`Received`: when the contract receives ether.


#### Functions
The contract has the following functions:

`constructor()`: Initializes the _marketOwner variable with the address of the contract creator.

`receive() external payable`: Receives ether and emits the Received event.

`getBalance() view public returns(uint)`: Returns the balance of the contract.

`transferETH(address payable _to, uint256 amount) external payable`: Transfers ether from the contract to the specified address.

`withdraw()` public payable: Allows the owner of the contract to withdraw ether from the contract.

`listNft(address _nftContract, uint256 _tokenId, uint256 _price) public payable nonReentrant`: Lists an NFT on the marketplace. Requires a fee to be paid to the marketplace. Transfers the ownership of the NFT to the contract. Emits the NFTListed event.

`buyNft(address _nftContract, uint256 _tokenId) public payable nonReentrant`: Allows a user to buy an NFT from the marketplace. Requires the user to pay the asking price for the NFT. Transfers ownership of the NFT to the buyer. Emits the NFTSold event.
`resellNft(address _nftContract, uint256 _tokenId, uint256 _price) public payable nonReentrant`: Allows a user to resell an NFT purchased from the marketplace. Requires the user to pay a listing fee. Transfers ownership of the NFT to the contract. Emits the NFTListed event.

`removeItem(uint i) public`: Removes an NFT from the _idToNFT mapping.

`removeNFTFromSale(address _nftContract, uint256 _tokenId) public returns(NFT[] memory)`: Removes an NFT from the marketplace. Requires the user to be the seller of the NFT. Emits the NFTListed event.

`getListedNfts() public view returns (NFT[] memory)`: Returns an array of all NFTs listed on the marketplace.
`getMyNfts()`: This function returns an array of all the NFTs owned by the caller.


### Contract Usage

The `Marketplace` contract can be used to buy and sell NFTs on a blockchain network. 

#### Listing an NFT

To list an NFT for sale on the marketplace, use the `listNft` function. The function takes three arguments: the address of the NFT contract, the token ID of the NFT, and the asking price in ether. The function requires the caller to pay a listing fee in ether. The NFT will be transferred from the caller to the marketplace contract, and the NFT will be marked as listed for sale.

#### Buying an NFT

To buy an NFT from the marketplace, use the `buyNft` function. The function takes two arguments: the address of the NFT contract and the token ID of the NFT. The function requires the caller to pay the asking price in ether. The NFT will be transferred from the marketplace contract to the buyer, and the seller will receive the payment.

#### Reselling an NFT

To resell an NFT that was purchased from the marketplace, use the `resellNft` function. The function takes three arguments: the address of the NFT contract, the token ID of the NFT, and the asking price in ether. The function requires the caller to pay a listing fee in ether. The NFT will be transferred from the caller to the marketplace contract, and the NFT will be marked as listed for sale.

#### Retrieving NFTs

To retrieve NFTs owned by a user, use one of the following functions: `getMyNfts`, `getMyListedNfts`, or `getMySpecificListedNft`.

`getMyNfts`: returns an array of all NFTs owned by the caller, regardless of whether they are listed for sale or not.

`getMyListedNfts`: returns an array of all NFTs listed for sale by the caller.

`getMySpecificListedNft`: returns an array with a single element containing the NFT specified by its contract address and token ID if it is listed for sale by the caller.

These functions loop through all NFTs tracked by the marketplace contract and return an array of NFTs that match the criteria. The `NFT` struct contains information about the NFT's contract address, token ID, seller, owner, and price.

It's important to note that the functions `getMyNfts` and `getMyListedNfts` return an array of NFTs, while getMySpecificListedNft returns an array with a single element.
