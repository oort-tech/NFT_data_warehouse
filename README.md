# NFTVerse GraphQL Subgraph

## `atomicMatch_()` Input Deep Dive
addrs[14]:
- `[0]`: exchange address; typically WyvernExchange’s contact address
- `[1]`: buy.maker; same as sell.taker; indicating the side of sell, depending on whether it’s a buy-side order or a sell-side order
- `[2]`: buy.taker; same as sell.maker; ditto
- `[3]`: buy.feeRecipient; the recipient address that’s going to receive fees from order makers; there’s only one of buy.feeRecipient or sell.feeRecipient that can be defined.
- `[4]`: buy.target; a target address that will receive delegatecall or call from the exchange, typically used to conduct NFT transfer, it is typically one of the following values:
  - The NFT address being traded
  - The MerkleValidator address, which performs Merkle root validation prior to accessing the NFT address.
  - The WyvernAtomizer address, which is the handler for bundle sale of NFTs
- `[5]`: buy.staticTarget: a static target that the exchange can call, this is uncommon.
- `[6]`: buy.paymentToken: token address that is used for payment, if it is 0x0, ETH is used.
- `[7]`: sell.exchange, same as buy.exchange
- `[8]`: sell.maker, same as buy.taker
- `[9]`: sell.taker, same as buy.maker
- `[10]`: sell.feeRecipient, only one can be defined with buy.feeRecipient
- `[11]`: sell.target: same as buy.target
- `[12]`: sell.staticTarget: ditto, uncommon to be used
- `[13]`: sell.paymentToken:  same as buy.paymentToken

uints:
- `[0]`: buy.makerRelayFee. royalty fee paid to the original creator at buy.feeRecipient from buy.maker
- `[1]`: buy.takerRelayFee. royalty fee paid to the original creator at sell.feeRecipient from sell.maker
- `[2]`: buy.makerProtocolFee. protocol charge fee paid to the exchange from buy.maker
- `[3]`: buy.takerProtocolFee. protocol charge fee paid to the exchange from sell.maker
- `[4]`: buy.basePrice. base price for the order listing.
- `[5]`: buy.extra. extra price to be adjusted over time automatically to the base price. e.g. the sell prices wane over time as auction is closer to the end.
- `[6]`: buy.listingTime
- `[7]`: buy.expirationTime
- `[8]`: buy.salt. just some random value for order dedup.
- `[9]`: sell.makerRelayFee. ditto, royalty fee paid from sell.maker.
- ... simply replace `[0]` - `[8]`'s buyer with seller.

feeMethodsSidesKindsHowToCalls:
- `[0]`: buy.feeMethod. Either Protocol or SplitFee, if is Protocol method, fees are not sent to the exchange, but directly to the fee.Recipients.
- `[1]`: buy.side. typically buyer
- `[2]`: buy.saleKind. Fixed (i.e. Direct purchase) or Auction.
- `[3]`: buy.howToCall. Either Call or Delegatecall. Call is typically issued directly to NFT targets mentioned above to conduct transfer, delegatecall is typically issued to MerkleValidator or WyvernAtomicizer to forward the actual transfer.
- `[4] - [8]`: sell.[...] correspondence

calldataBuy: a hex representation of `0x{functionSelector}${functionArg1}{functionArg2}...`, containing data to forward to the buy/sell.target to perform actual token transfer. Types of `functionSelector` are listed [here](./opensea-subgraph-dev/src/utils.ts).

calldataBuy: similar to calldataBuy.

replacementPatternBuy: a hex mask used to transform calldataBuy and calldataSell into the merged call data used to perform `.call` or `.delegatecall`.

replacementPatternSell: ditto.

staticExtradataBuy: extra data to call to buy.staticTarget, uncommon.

staticExtratdataSell: extra data to call to sell.staticTarget, uncommon.

vs: signature verification related

rssMetadata: signature verification related

## Unit / Integration Testing

See `opensea-subgraph-dev/tests`.

## Smoke Testing

For the intergration test, we want to simulate several (almost) real NFT trading scenarios on our test blockchain network, and check if our indexer can work seamlessly with those.
### Dependencies
1. A local Graph Node server. Follow the github [instructions](https://github.com/graphprotocol/graph-node) to install. This allows us to have a local graph node that can index our test network. Along this process you will need to set up a IPFS and a local PostgresDB as well.
2. A local OpenEthereum server. Follow the github [instructions ](https://github.com/openethereum/openethereum/releases/tag/v3.3.5) to install. This allows us to bootstrap a local Ethereum private blockchain which supports the [trace](https://openethereum.github.io/JSONRPC-trace-module) module. Not all blockchain implementation supports this `trace` module (e.g. Ganache), but it is important for us to use one that is compatible because only those implementations support using `callHandlers` in the Graph protocol ([reference](https://thegraph.com/docs/en/operating-graph-node/#network-clients)), which is the foundation of our indexer. The prodution Ethereum mainnet also supports this module.
3. [Truffle](https://www.npmjs.com/package/truffle). This allows us to easily deploy our local [OpenSea smart contract](./opensea-dev/contracts/OpenSeaV1.sol) and [Sample NFT contracts](./opensea-nft-dev/contracts/) to our test network.
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
2. We disabled all the hash checks when using MerkleValidation as a call target, so we don't have to worry about constructing correct signatures when sending a simulated trade, the signatures are not valuable data for indexing anyway.
3. We disabled all the intermediary proxies such as [OpenSea Registry](https://etherscan.io/address/0xa5409ec958C83C3f309868babACA7c86DCB077c1), and [Token transfer proxy](https://etherscan.io/address/0xE5c783EE536cf5E63E792988335c4255169be4E1). These intermediary proxies are mostly for security / authentication but we don't need to worry about those. The call to `buy.target` / `sell.target` is changed to be always with a direct EVM `call`.

These changes should not affect the core order matching logic.

#### Deployment

**Note: If you experience "ProviderError" with code -32010 while running the transaction, please quit the truffle console and restart console, no need to redeploy. This is because when concurrently running multiple Ethereum client sessions (e.g. one OpenSea market place and the other NFT smart contract), transaction nonces are not been synhronized.**

To deploy these sample contracts, we do the following:

First in one terminal session, let's deploy the NFT contracts:
```sh
$ cd opensea-nft-dev;
$ npm install;
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

Then, in **another** terminal session, let's deploy the OpenSea marketplace contract, the reason we cannot place both deployment in the same session is because OpenSea's solidity version is too old to make it work easily with ERC721 contract code.

We run the following:
```sh
$ cd opensea-dev;
$ npm install;
# Migrate would compile the OpenSeaV1 contracts and deploy to the blockchain.
$ truffle migrate --network openeth;
# Fix a bug in Truffle that could make console unable to open!
$ ./fix_build_json_empty_metadata.sh
```

The above command should generate something like:

```
Deploying 'MerkleValidator'
   ---------------------------
   > transaction hash:    0x5b4b701b8bcd1e2091623da58c3e5291ce9b8bbbbf9e85dee6153ae58dae6b1d
   > Blocks: 0            Seconds: 0
   > contract address:    0x28958d023E94514CD24e1a66ECd1Fb79682e4BE2
   > block number:        14
   > block timestamp:     1683395208
   > account:             0xc90a9b3f192fE528070Fc32d1ec1155f4F70AB29
   > balance:             1606938044258990275541962092341162602522202.993782792835301376
   > gas used:            281548 (0x44bcc)
   > gas price:           0 gwei
   > value sent:          0 ETH
   > total cost:          0 ETH

...

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

Again, note down:
1. **contract address** for MerkleValidator: `0x28958d023E94514CD24e1a66ECd1Fb79682e4BE2`, this will be useful for constructing sample calldata that invokes the MerkleValidator. In production mainnet, MerkleValidator is deployed at [0xBAf2127B49fC93CbcA6269FAdE0F7F31dF4c88a7](https://etherscan.io/address/0xBAf2127B49fC93CbcA6269FAdE0F7F31dF4c88a7#code). When running the Smoke test, we need to make sure our indexer references this address as MerkleValidator instead.
2. **contract address** for WyvernExchange: `0xc0a6BAe968Da8F563fE2467EeB0AebFD0170D1a5`, this is the local OpenSea marketplace's address.
3. **block number** for WyvernExchange: `75`, this will be the start block for the subgraph indexer!

Now the contracts are deployed!

#### Sample Order 1 `orders/SimpleNft_1.js`
This is a simple order that is:
1. Sell-side maker / buy-side taker order (i.e. buyer directly purchases a sell order)
2. No protocol fees or relay fees involved
3. NFT token is transfered from one address to another.
4. Calls `transferFrom()` on ERC721 NFT contracts.

Order paramters (e.g. from address, to address, base price, etc) can be configured in the corresponding JS file.

This is to simulate test case for real Ethereum OpenSea transactions like [this](https://etherscan.io/tx/0xc18139504f0802503aeb0b33627495ef9a1fdc30e5bc552237bd82927d4ea259), in which the buy and sell target are both NFT contract located at address [0xa08126f5e1ed91a635987071e6ff5eb2aeb67c48](https://etherscan.io/token/0xa08126f5e1ed91a635987071e6ff5eb2aeb67c48).

##### Step 1: Prepare The NFT For Trading
Assuming the NFT contract is deployed above, We first need to `mint()` the NFT to an address to create a new token id (starts from `0` and incrementing, think of this as an item in a collection) and declare an owner address for that particular token id:
```sh
$ cd opensea-nft-dev;
$ truffle console --network openeth;
$ truffle(openeth) const nft = await SimpleNFT.deployed()
$ truffle(openeth) nft.mint("$MAKER_ADDR")
$ ...
```
where `$MAKER_ADDR` is typicall the owner of this token, you may use one of the sample addresses defined in `private_chain.json`. The order JS file should've already defined one for you.

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
# Open Truffle console
$ truffle console --network openeth
# grab the exchange contract instance
$ truffle(openeth) const exchange = await WyvernExchange.deployed()
# execute the order
$ truffle(openeth) const { buildOrder, executeOrder } = require("./orders/SimpleNft_1.js")
$ truffle(openeth) var order = buildOrder(exchange, "$NFT_ADDR", "$TOKEN_ID")
$ truffle(openeth) executeOrder(exchange, order)
```
where `$NFT_ADDRESS` should be the `SimpleNFT` contract address you noted down in previous steps, and `$TOKEN_ID` is the token id you just minted (should be `0` for the first time).

It should shown something like:
```
{
  tx: '0xd13ef4e97e8d07fb4e7e162cf60a76264509763b105b1e8c7d0d756839f6e368',
  receipt: {
    blockHash: '0xb4c56d591eadebfb8e3e8a60d1e8b881bee3752b0e02d7469da9f62f7726da9e',
    blockNumber: 258,
    contractAddress: null,
    cumulativeGasUsed: 252163,
    effectiveGasPrice: 0,
    from: '0xc90a9b3f192fe528070fc32d1ec1155f4f70ab29',
    gasUsed: 252163,
    logs: [ [Object] ],
    logsBloom: '0x00000000000000000000200000000000000000000000000000000000004000000000000014000000000040000000000000000000000000000004000020000000000100000000000000000008000000000000000000000000000000000000000000000000020000000000000000000800000000000000000000000210000008000000000000000000000100000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000001000000040000002000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000200000000000000000000000',
    status: true,
    to: '0x1f36edc2a86402d1d1316c78206bf8ab6139e3f9',
    transactionHash: '0xd13ef4e97e8d07fb4e7e162cf60a76264509763b105b1e8c7d0d756839f6e368',
    transactionIndex: 0,
    type: '0x0',
    rawLogs: [ [Object], [Object] ]
  },
  logs: [
    {
      address: '0x1f36eDc2A86402d1D1316c78206Bf8Ab6139E3F9',
      blockHash: '0xb4c56d591eadebfb8e3e8a60d1e8b881bee3752b0e02d7469da9f62f7726da9e',
      blockNumber: 258,
      logIndex: 1,
      removed: false,
      transactionHash: '0xd13ef4e97e8d07fb4e7e162cf60a76264509763b105b1e8c7d0d756839f6e368',
      transactionIndex: 0,
      transactionLogIndex: '0x1',
      type: 'mined',
      id: 'log_e9cc06df',
      event: 'OrdersMatched',
      args: [Result]
    }
  ]
}
```

This should execute the sample order and make the data available for indexing later!

Querying the NFT owner will show the NFT is owned by the new address:
```sh
$ cd opensea-nft-dev;
$ truffle console --network openeth
$ truffle(openeth) nft.ownerOf(0)
...
# should now change to the buyer's address!
'0x09dD1D0088B6934F04505cEe81b6E80e82d2c888'
```

#### Sample Order 2 `orders/SimpleNft_2.js`
This is a sample order similar to Sample Order 1 but:
1. It uses a sample `MerkleValidator` as a buy and sell target.
2. It calls the `matchERC721UsingCriteria()` method on MerkleValidator, which in turn does some validation and then calls `transferFrom()` on the actual NFT.

This is to simulate a test case for real Ethereum OpenSea transactions like [this](https://etherscan.io/tx/0xcaae2c667214d12bc80e36e88f62d29777e60bc217e95c507ed6947c0c2d1747), in which the buy and sell target are both MerkleValidator located at address [0xBAf2127B49fC93CbcA6269FAdE0F7F31dF4c88a7](https://etherscan.io/address/0xBAf2127B49fC93CbcA6269FAdE0F7F31dF4c88a7#code).

##### Step 1: Prepare The NFT For Trading

Same as Sample Order 1. An simple way to extend forward is just to mint a new token id by running:
```sh
$ cd opensea-nft-dev;
$ truffle console --network openeth;
$ truffle(openeth) const nft = await SimpleNFT.deployed()
$ truffle(openeth) nft.mint("$MAKER_ADDR")
```
This should make token id `1` available for use, which is initially owned by `$MAKER_ADDR`.

##### Step 2: Execute The Order

Assuming contracts have been migrated. To execute the order, run the following:
```sh
# Go to the marketplace terminal session
$ cd opensea-dev;
# Open Truffle console
$ truffle console --network openeth
# grab the exchange & merkle validator contract instance
$ truffle(openeth) const exchange = await WyvernExchange.deployed()
$ truffle(openeth) const merkle = await MerkleValidator.deployed()
# execute the order
$ truffle(openeth) const { buildOrder, executeOrder } = require("./orders/SimpleNft_2.js")
$ truffle(openeth) var order = buildOrder(exchange, merkle, "$NFT_ADDR", "$TOKEN_ID")
$ truffle(openeth) executeOrder(exchange, order)
```
where the `$NFT_ADDR` should the same one you've noted down before, and `$TOKEN_ID` should be `1` which is newly minted.

It should show something like:
```
{
  tx: '0xe6521627120c3ab6bdbce6efb7ba20e20ef47b649b1ed12cda1e5e566188620b',
  receipt: {
    blockHash: '0x340e2a00f2e8260dea38307e75c576995c77b0912702b6a7d9653e9e14ae9593',
    blockNumber: 261,
    contractAddress: null,
    cumulativeGasUsed: 202316,
    effectiveGasPrice: 0,
    from: '0xc90a9b3f192fe528070fc32d1ec1155f4f70ab29',
    gasUsed: 202316,
    logs: [ [Object] ],
    logsBloom: '0x00000000000000000000200000000000000000000000000000000000004000000000000010000000000040000000000000000000000000000004000020000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000800000000000000000000000200000000000000000000000000000100000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000001000000040000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000200000000000000000000000',
    status: true,
    to: '0x1f36edc2a86402d1d1316c78206bf8ab6139e3f9',
    transactionHash: '0xe6521627120c3ab6bdbce6efb7ba20e20ef47b649b1ed12cda1e5e566188620b',
    transactionIndex: 0,
    type: '0x0',
    rawLogs: [ [Object] ]
  },
  logs: [
    {
      address: '0x1f36eDc2A86402d1D1316c78206Bf8Ab6139E3F9',
      blockHash: '0x340e2a00f2e8260dea38307e75c576995c77b0912702b6a7d9653e9e14ae9593',
      blockNumber: 261,
      logIndex: 0,
      removed: false,
      transactionHash: '0xe6521627120c3ab6bdbce6efb7ba20e20ef47b649b1ed12cda1e5e566188620b',
      transactionIndex: 0,
      transactionLogIndex: '0x0',
      type: 'mined',
      id: 'log_2cb519fa',
      event: 'OrdersMatched',
      args: [Result]
    }
  ]
}
{
  tx: '0xce33921c0a195f7710a47c6a7902e5b987918063ea28d1028d49178b12358022',
  receipt: {
    blockHash: '0x1d5f7a11826590d7ffdbdb99bdf20405b9b5670a9b9fe201cc33eea3039b804c',
    blockNumber: 262,
    contractAddress: null,
    cumulativeGasUsed: 44801,
    effectiveGasPrice: 0,
    from: '0xc90a9b3f192fe528070fc32d1ec1155f4f70ab29',
    gasUsed: 44801,
    logs: [],
    logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000004000020040000000100000000000000000008000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000010000008000000000000000000000100000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000040000002000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000',
    status: true,
    to: '0x1f36edc2a86402d1d1316c78206bf8ab6139e3f9',
    transactionHash: '0xce33921c0a195f7710a47c6a7902e5b987918063ea28d1028d49178b12358022',
    transactionIndex: 0,
    type: '0x0',
    rawLogs: [ [Object] ]
  },
  logs: []
}
```

Again querying the NFT owner will show the NFT is owned by the new address:
```sh
$ cd opensea-nft-dev;
$ truffle console --network openeth
$ truffle(openeth) const nft = await SimpleNFT.deployed()
$ truffle(openeth) nft.ownerOf(1)
...
# should now change to the buyer's address as well!
'0x09dD1D0088B6934F04505cEe81b6E80e82d2c888'
```

### Run Subgraph Indexer

#### Deployment
Assuming OpenEthereum is running and the local Graph node server is pointing to the local OpenEthereum http server, we can run the subgraph indexer against our test network by doing the following:
1. Go to `/opensea-subgraph-dev`.
2. Change the `address` and `startBlock` of the `subgraph.yaml` to what you've noted down during the OpenSea smart contract deployment.
3. Deploy using:
   ```sh
   $ graph create --node http://127.0.0.1:8020/ OpenSea
   $ graph deploy --node http://127.0.0.1:8020/ --ipfs http://127.0.0.1:5001/ OpenSea
   ```
4. This should create a local GraphQL server at `http://127.0.0.1:8000/subgraphs/name/OpenSea/graphql`

#### Validation

First, lets check our assets with query:
```
query MyQuery {
  assets {
    id
    tokenId
    tokenURI
    tradeCount
  }
}
```
and we get:
```
{
  "data": {
    "assets": [
      {
        "id": "0x65d26bdfe2572685dd86d7b4eb164f891faeb02a-0",
        "tokenId": "0",
        "tokenURI": null,
        "tradeCount": 1
      },
      {
        "id": "0x65d26bdfe2572685dd86d7b4eb164f891faeb02a-1",
        "tokenId": "1",
        "tokenURI": null,
        "tradeCount": 1
      }
    ]
  }
}
```
As expected, we have 2 token IDs being traded after executing the 2 orders, each one with a tradeCount = 1. Note that we did not define a tokenURI on our NFT, so it's expected that tokenURI is null.

Next, let's check our collections and their relationship with assets with query:
```
query MyQuery {
  collections {
    tradeCount
    totalSupply
    totalRevenueETH
    symbol
    royaltyFee
    nftStandard
    name
    marketplaceRevenueETH
    id
    cumulativeTradeVolumeETH
    creatorRevenueETH
    assets {
      id
    }
  }
}
```

and we get:
```
{
  "data": {
    "collections": [
      {
        "tradeCount": 2,
        "totalSupply": null,
        "totalRevenueETH": "0",
        "symbol": "SNFT",
        "royaltyFee": "0",
        "nftStandard": "ERC721",
        "name": "SimpleNFT",
        "marketplaceRevenueETH": "0",
        "id": "0x65d26bdfe2572685dd86d7b4eb164f891faeb02a",
        "cumulativeTradeVolumeETH": "4.18",
        "creatorRevenueETH": "0",
        "assets": [
          {
            "id": "0x65d26bdfe2572685dd86d7b4eb164f891faeb02a-0"
          },
          {
            "id": "0x65d26bdfe2572685dd86d7b4eb164f891faeb02a-1"
          }
        ]
      }
    ]
  }
}
```

So the data is correct, and note that we were able to fetch the NFT standards/metadata for the collection as well, the two token IDs are also correct.

Next, let's check our users and their purchases/sales (i.e Trades) with query:
```
query MyQuery {
  users {
    id
    purchases {
      transactionHash
      timestamp
      saleKind
      priceETH
      isBundle
      id
    }
    sales {
      id
      isBundle
      priceETH
      saleKind
      timestamp
      transactionHash
    }
  }
}
```
and we get:
```
{
  "data": {
    "users": [
      {
        "id": "0x09dd1d0088b6934f04505cee81b6e80e82d2c888",
        "purchases": [
          {
            "transactionHash": "0x65b6fc28166d229ebf989fd65d47a9b50ae0de2fb992bb262a423e4f30538368",
            "timestamp": "1683568824",
            "saleKind": "DIRECT_PURCHASE",
            "priceETH": "2.09",
            "isBundle": false,
            "id": "0x65b6fc28166d229ebf989fd65d47a9b50ae0de2fb992bb262a423e4f30538368-0x23b872dd-0"
          },
          {
            "transactionHash": "0x8b6b768f28f901997abed3445c60d0be858ee1bac87e324465f53a52ab666738",
            "timestamp": "1683568862",
            "saleKind": "DIRECT_PURCHASE",
            "priceETH": "2.09",
            "isBundle": false,
            "id": "0x8b6b768f28f901997abed3445c60d0be858ee1bac87e324465f53a52ab666738-0xfb16a595-1"
          }
        ],
        "sales": []
      },
      {
        "id": "0xc90a9b3f192fe528070fc32d1ec1155f4f70ab29",
        "purchases": [],
        "sales": [
          {
            "id": "0x65b6fc28166d229ebf989fd65d47a9b50ae0de2fb992bb262a423e4f30538368-0x23b872dd-0",
            "isBundle": false,
            "priceETH": "2.09",
            "saleKind": "DIRECT_PURCHASE",
            "timestamp": "1683568824",
            "transactionHash": "0x65b6fc28166d229ebf989fd65d47a9b50ae0de2fb992bb262a423e4f30538368"
          },
          {
            "id": "0x8b6b768f28f901997abed3445c60d0be858ee1bac87e324465f53a52ab666738-0xfb16a595-1",
            "isBundle": false,
            "priceETH": "2.09",
            "saleKind": "DIRECT_PURCHASE",
            "timestamp": "1683568862",
            "transactionHash": "0x8b6b768f28f901997abed3445c60d0be858ee1bac87e324465f53a52ab666738"
          }
        ]
      }
    ]
  }
}
```
And see how a user's sales and purchase histories are automatically populated!

## Production Subgraph Deployment
We have deployed the latest version on Subgraph Studio, available for querying [here](https://api.studio.thegraph.com/proxy/45684/opensea-subgraph-dcab1/v0.0.11/graphql).
