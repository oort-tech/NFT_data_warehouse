# NFTVerse GraphQL Subgraph

## Implementation

TODO:

## Unit Testing

TODO: write a bunch of unit tests to test our function handling.
## Integration Testing

For the intergration test, we want to simulate several (almost) real NFT trading scenarios on our test blockchain network, and check if our indexer can work seamlessly with those.
### Dependencies
1. A local Graph Node server. Follow the github [instructions](https://github.com/graphprotocol/graph-node) to install. This allows us to have a local graph node that can index our test network. Along this process you will need to set up a IPFS and a local PostgresDB as well.
2. A local OpenEthereum server. Follow the github [instructions ](https://github.com/openethereum/openethereum/releases/tag/v3.3.5) to install. This allows us to bootstrap a local Ethereum private blockchain which supports the [trace](https://openethereum.github.io/JSONRPC-trace-module) module. Not all blockchain implementation supports this `trace` module (e.g. Ganache), but it is important for us to use one that is compatible because only those implementations support using `callHandlers` in the Graph protocol ([reference](https://thegraph.com/docs/en/operating-graph-node/#network-clients)), which is the foundation of our indexer. The prodution Ethereum mainnet also supports this module.
3. [Truffle](https://www.npmjs.com/package/truffle). This allows us to easily deploy our local [OpenSea smart contract](./opensea-dev/contracts/OpenSeaV1.sol) and [same NFT contracts](./opensea-nft-dev/contracts/) to our test network.
4. [The Graph SDK](https://www.npmjs.com/package/@graphprotocol/graph-ts). This is the framework that can help us assemble and deploy our subgraph to our local graph node.

### Setup
#### OpenEthereum
```sh

$ cd openethereum-dev;
$ ./run_openeth.sh
```

This spins up a local private blockchain with the following dummy accounts:

**Address**: `0xc90a9b3f192fE528070Fc32d1ec1155f4F70AB29`
**Private key**: `ac5821b46d04d7ab18d023db5f99142938a33b9b691e0dc28f2c64f34bb994a0`

**Address**: `0x09dD1D0088B6934F04505cEe81b6E80e82d2c888`
**Private key**: `915d73ffb4744ea9b18eed770629654366444c55d143bf448885dfdc2d2102b5`

**Address**: `0xEfcE2efE40DECCcf0F763a2FB8CdB4b89Fd7f622`
**Private key**: `2ceba3a2b5c84df9f5b1ea9091b09443443ee4186257f5d18f56afa90c4078f8`

Feel free to use MetaMask to connect to the local chain at `localhost:8545` (per its default) and create more accounts.

#### Local Graph Node
Assuming your local graph node is installed successfully, start the node by running:
```sh
$ cargo run -p graph-node --release -- \
  --postgres-url postgresql://$USERNAME:$PASS@localhost:5432/$DBNAME \
  --ethereum-rpc mainnet:http://localhost:8545 \
  --ipfs 127.0.0.1:5001
```

Change `$USERNAME` to your local PostgresDB username, `PASS` to your local PostgresDB password and `DBNAME` to a new database you've created for storing the subgraph data.

Also note that `mainnet:http://localhost:8545` should be the JSON-RPC endpoint for your local OpenEthereum blockchain.

Alternatively you may use the Docker setup, but make sure to change the `--ethereum-rpc` argument to point to the right local OpenEthereum blockchain.

### Deploy Sample Contracts
#### Intro - NFT Contracts

The sample NFT contracts are placed under `opensea-nft-dev/contracts` as part of a Truffle project:

1. `opensea-nft-dev/contract/SimpleNft.sol`: A simple [ERC721](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol)-compatible NFT token that supports `mint()` (assign the ownership of the token to an address), `setApprovalForAll()/approve()` (allow an address to operate this NFT), and more operations. We will mainly use these two operations for our simulated trading because they are the most common.
   
#### Intro - OpenSea Market Place Contract

We have pulled in an aggregated version of `WyvernExchange` located [here](./opensea-dev/contracts/OpenSeaV1.sol) that is simulating almost exactly how the OpenSeaV1 protocol works on Ethereum mainnet, except a few tweaks to simplify testing:
1. We disabled the need to `approve` an order before it can be matched. This simplifies the trading process.
2. We disabled using MerkleValidation as a call target, so we don't have to worry about signature validities when sending a simulated trade.
3. We disabled all the intermediary proxies such as [OpenSea Registry](https://etherscan.io/address/0xa5409ec958C83C3f309868babACA7c86DCB077c1), and [Token transfer proxy](https://etherscan.io/address/0xE5c783EE536cf5E63E792988335c4255169be4E1). These intermediary proxies are mostly for security / authentication but we don't need to worry about those.

#### Deployment

To deploy these sample contracts, we do the following:

First in one terminal session, let's deploy the NFT contracts:
```sh
$ cd opensea-nft-dev;
# Migrate would compile the contracts and deploy to the blockchain.
$ truffle migrate --network openeth
```
Assuming we only have `SimpleNft.sol` under `opensea-nft-dev/contracts`, the above command shoul generate something similar to the following lines:
```
1_deploy_nft.js
===============

   Replacing 'SimpleNFT'
   ---------------------
   > transaction hash:    0xe886dd81bc64959584778a47e5c69519f35a9fc9aba26d9172a62e5aa7af8e71
   > Blocks: 0            Seconds: 0
   > contract address:    0x289Ff5674D83f66DBc5Cb0AC09096e905A4B7E68
   > block number:        78
   > block timestamp:     1683334281
   > account:             0xc90a9b3f192fE528070Fc32d1ec1155f4F70AB29
   > balance:             1606938044258990275541962092341162602522194.633782792835301376
   > gas used:            2820195 (0x2b0863)
   > gas price:           0 gwei
   > value sent:          0 ETH
   > total cost:          0 ETH

   > Saving artifacts
   -------------------------------------
   > Total cost:                   0 ETH
```

Note down the **contract address** `0x289Ff5674D83f66DBc5Cb0AC09096e905A4B7E68`, this would be the NFT smart contract's address.

Background: `opensea-nft-dev/truffle-config.js` should contain a network configuration for `openeth`, it should work for the default case, but you may update its configuration if needed.

Then, in another terminal session, let's deploy the OpenSea marketplace contract, the reason we cannot place both deployment in the same session is because OpenSea's solidity version is too old to make it work easily with ERC721 contract code.

We run the following:
```sh
$ cd opensea-dev;
# Migrate would compile the OpenSeaV1 contracts and deploy to the blockchain.
$ truffle migrate --network openeth;
```

The above command should generate something like:

```
Replacing 'WyvernExchange'
   --------------------------
   > transaction hash:    0x881b1b506c333c994a3da2aefd58e90a61bde5a8252b353c837d419b6fe862a8
   > Blocks: 0            Seconds: 0
   > contract address:    0xc0a6BAe968Da8F563fE2467EeB0AebFD0170D1a5
   > block number:        75
   > block timestamp:     1683334120
   > account:             0xc90a9b3f192fE528070Fc32d1ec1155f4F70AB29
   > balance:             1606938044258990275541962092341162602522194.633782792835301376
   > gas used:            5829468 (0x58f35c)
   > gas price:           0 gwei
   > value sent:          0 ETH
   > total cost:          0 ETH
```

Again, note down the **contract address**: `0xc0a6BAe968Da8F563fE2467EeB0AebFD0170D1a5`, this is the local OpenSea marketplace's address.

And note down the **block number** as well, this will be the start block for the subgraph indexer!

Now the contracts are deployed!

#### Sample Order 1 `orders/SimpleNft_1.js`
This is a simple order that is:
1. Sell-side maker / buy-side taker order (i.e. buyer directly purchases a sell order)
2. No protocol fees or relay fees involved
3. NFT token is transfered from one address to another.

Order paramters (e.g. from address, to address, base price, etc) can be configured in the corresponding JS file.

##### Step 1: Prepare The NFT For Trading
Assuming the NFT contract is deployed above, We first need to `mint()` the NFT to an address to create a new token id (starts from `0` and incrementing, think of this as an item in a collection) and declare an owner address for that particular token id:
```sh
$ cd opensea-nft-dev;
$ truffle console --network openeth;
$ truffle(openeth) const nft = await SimpleNFT.deployed()
$ truffle(openeth) nft.mint("$MAKER_ADDRESS")
$ ...
```
where `$MAKER_ADDRESS` is typicall the owner of this token, you may use one of the sample addresses defined in `private_chain.json`. The order JS file should've already defined one for you.

This would mint the fresh NFT and make token id `0` available for trading.

Then, we need to grant our exchange access to operate the NFT:
```sh
$ truffle(openeth) nft.setApprovalForAll("$EXCHANGE_ADDRESS", true)
```
where `$EXCHANGE_ADDRESS` is the contract address for the deployed exchange you should've noted down above.

This should've granted our exchange the ability to transfer this NFT to other addresses.

##### Step 2: Execute The Order

Assuming contracts have been migrated. To execute the order, run the following:
```sh
# Go to the marketplace terminal session
$ cd opensea-dev;
# IMPORTANT: needs to run this before opening Truffle console due to a Truffle bug!
$ ./fix_build_json_empty_metadata.sh
# Open Truffle console
$ truffle console --network openeth
# grab the exchange contract instance
$ truffle(openeth) const exchange = await WyvernExchange.deployed()
# execute the order
$ truffle(openeth) await require("./orders/SimpleNft_1.js")(exchange, "$NFT_ADDRESS", "$TOKEN_ID")
```
where `$NFT_ADDRESS` should be the `SimpleNFT` contract address you noted down in previous steps, and `$TOKEN_ID` is the token id you just minted (should be `0` for the first time).

This should execute the sample order and make the data available for indexing later!

Querying the NFT owner will show the NFT is owned by the new address:
```sh
$ cd opensea-nft-dev;
$ truffle console --network openeth
$ truffle(openeth) nft.ownerOf(0)
...
# should now change to the buyer's address!
```

#### TODO: Sample Order 2

### Run Subgraph Indexer
TODO:

## Smoke Testing

TODO: run indexer against real ethereum network for a few minutes and note the results.
