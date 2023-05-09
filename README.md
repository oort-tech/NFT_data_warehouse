# OpenSea Marketplace Indexer

This repo contains the code behind the subgraph deployed [here](https://api.studio.thegraph.com/proxy/46323/opensea-marketplace-indexer/4.1.0/graphql?query=%0A++++%23%0A++++%23+Welcome+to+The+GraphiQL%0A++++%23%0A++++%23+GraphiQL+is+an+in-browser+tool+for+writing%2C+validating%2C+and%0A++++%23+testing+GraphQL+queries.%0A++++%23%0A++++%23+Type+queries+into+this+side+of+the+screen%2C+and+you+will+see+intelligent%0A++++%23+typeaheads+aware+of+the+current+GraphQL+type+schema+and+live+syntax+and%0A++++%23+validation+errors+highlighted+within+the+text.%0A++++%23%0A++++%23+GraphQL+queries+typically+start+with+a+%22%7B%22+character.+Lines+that+start%0A++++%23+with+a+%23+are+ignored.%0A++++%23%0A++++%23+An+example+GraphQL+query+might+look+like%3A%0A++++%23%0A++++%23+++++%7B%0A++++%23+++++++field%28arg%3A+%22value%22%29+%7B%0A++++%23+++++++++subField%0A++++%23+++++++%7D%0A++++%23+++++%7D%0A++++%23%0A++++%23+Keyboard+shortcuts%3A%0A++++%23%0A++++%23++Prettify+Query%3A++Shift-Ctrl-P+%28or+press+the+prettify+button+above%29%0A++++%23%0A++++%23+++++Merge+Query%3A++Shift-Ctrl-M+%28or+press+the+merge+button+above%29%0A++++%23%0A++++%23+++++++Run+Query%3A++Ctrl-Enter+%28or+press+the+play+button+above%29%0A++++%23%0A++++%23+++Auto+Complete%3A++Ctrl-Space+%28or+just+start+typing%29%0A++++%23%0A++) that allows querying the OpenSea Marketplace.

## Code Structure
1. `./abis/' contain the ABIs needed to interact with the smart contract [here](https://etherscan.io/address/0x00000000006c3852cbef3e08e8df289169ede581). These were extracted from Etherscan directly.
2. `./contracts/` contain the smart contracts deployed to the mainnet. They were pulled from Etherscan [here](https://etherscan.io/address/0x00000000006c3852cbef3e08e8df289169ede581#code). These allow understanding the event types that are emitted by the smart contract better so that our subgraph can listen for them. They are not directly needed for subgraph deployment.
3. `./opensea-marketplace-indexer/` contains the code relavent to the subgraph and event handlers.
4. `Makefile` defines targets to run The Graph CLI commands (init, codegen, deploy) reproducibly.

## Deploying the Subgraph
1. Run `yarn install` to install the package dependencies. This will create a folder called `./opensea-marketplace-indexer/node_modules/` that is needed to run tests and build the graph.
2. Run `graph codegen` in `./opensea-marketplace-indexer/` to create generated code that maps the graphQL schema to typescript objects that the event handlers can access.
3. Run `make deploy` from the root directory of this project to get access to the new endpoint URL. Ensure to set a deployment key and change the version number in the makefile. You can create a deployment key by initializing a subgraph on The Graph Studio by following [these](https://thegraph.com/docs/en/deploying/subgraph-studio/) instructions.

## Event Handlers
The Seaport smart contract emits several [events/errors](https://docs.opensea.io/reference/seaport-events-and-errors) that the subgraph can listen for:
- OrderFulfilled
- OrderCancelled
- OrderValidated
- CounterIncremented
- OrdersMatched
- OrderAlreadyFilled
- InvalidTime
- InvalidConduit
- MissingOriginalConsiderationItems
- InvalidCalltoConduit
- ConsiderationNotMet
- InsufficientEtherSupplied
- and more...

`OrderFulfilled` is the main event we need to listen for in the subgraph (as the `./opensea-marketplace-indexer/subgraph.yaml` shows) since it represents the successful transfer of an NFT. The main event handler we implement is for `OrderFulfilled` (code in `./opensea-marketplace-indexer/src/mapping.ts`). The key to understanding an order is that is contains an offer and consideration. The offer and considerations are simply lists of NFTs or money. If the offer only has one item which is money, that implies the consideration must contain the NFTs. This represents the offerrer being the buyer and the recipient being the seller. On the flip side, if the offer contains NFTs, then the consideration must contain money, which implies the offerrer is the seller and the recipient is the buyer. This idea was inspired by the subgraph developed by Messari shown [here](https://thegraph.com/explorer/subgraphs/G1F2huam7aLSd2JYjxnofXmqkQjT5K2fRjdfapwiik9c?view=Indexers&chain=mainnet). Because the blockchain space is decentralized and open-source, we leveraged the code used by Messari and made sure to understand the logic of the event handlers by producing detailed comments, refractored the code, and deployed our own subgraph.

## Example Queries
Query Explanation:
This is daily summary of activity on opensea ordered by timestamp descendingly. Timestamp is unix time. Collection count is num nfts. Trade count is # of tx. Marketplace revenue is total commission opensea gets. Creator revenue is royalty for creator of nft. cumulative unique traders is num unique traders.. All described in schema.

Query:
```
query MyQuery {
  marketplaceDailySnapshots(orderBy: timestamp, orderDirection: desc, first: 10) {
    timestamp
    collectionCount
    tradeCount
    marketplaceRevenueETH
    creatorRevenueETH
    cumulativeUniqueTraders
  }
}
```

Response:
```
{
  "data": {
    "marketplaceDailySnapshots": [
      {
        "timestamp": "1667042075",
        "collectionCount": 23180,
        "tradeCount": 7824899,
        "marketplaceRevenueETH": "43800.834380183527292806",
        "creatorRevenueETH": "74492.415669454930158566",
        "cumulativeUniqueTraders": 949387
      },
      {
        "timestamp": "1667001599",
        "collectionCount": 23150,
        "tradeCount": 7806473,
        "marketplaceRevenueETH": "43738.176787282584821902",
        "creatorRevenueETH": "74387.893348037986406323",
        "cumulativeUniqueTraders": 947606
      },
      {
        "timestamp": "1666915199",
        "collectionCount": 23043,
        "tradeCount": 7763874,
        "marketplaceRevenueETH": "43532.261787868540258728",
        "creatorRevenueETH": "73954.582927599823814701",
        "cumulativeUniqueTraders": 943562
      },
      {
        "timestamp": "1666828787",
        "collectionCount": 22938,
        "tradeCount": 7717515,
        "marketplaceRevenueETH": "43343.602745388577815108",
        "creatorRevenueETH": "73611.622131133381652078",
        "cumulativeUniqueTraders": 939010
      },
      {
        "timestamp": "1666742399",
        "collectionCount": 22827,
        "tradeCount": 7675578,
        "marketplaceRevenueETH": "43146.273724946298454552",
        "creatorRevenueETH": "72675.597484367886446241",
        "cumulativeUniqueTraders": 935289
      },
      {
        "timestamp": "1666655999",
        "collectionCount": 22721,
        "tradeCount": 7637138,
        "marketplaceRevenueETH": "42980.533718782939901069",
        "creatorRevenueETH": "72413.134730755381746461",
        "cumulativeUniqueTraders": 931932
      },
      {
        "timestamp": "1666569599",
        "collectionCount": 22615,
        "tradeCount": 7596849,
        "marketplaceRevenueETH": "42805.048043532295979693",
        "creatorRevenueETH": "71980.953455698128578679",
        "cumulativeUniqueTraders": 928152
      },
      {
        "timestamp": "1666483199",
        "collectionCount": 22528,
        "tradeCount": 7551836,
        "marketplaceRevenueETH": "42641.68988078205175549",
        "creatorRevenueETH": "71724.313081246765697336",
        "cumulativeUniqueTraders": 924519
      },
      {
        "timestamp": "1666396799",
        "collectionCount": 22433,
        "tradeCount": 7505142,
        "marketplaceRevenueETH": "42483.690547075097825136",
        "creatorRevenueETH": "71467.753918575482313591",
        "cumulativeUniqueTraders": 920865
      },
      {
        "timestamp": "1666310399",
        "collectionCount": 22329,
        "tradeCount": 7459502,
        "marketplaceRevenueETH": "42132.127187168000010762",
        "creatorRevenueETH": "71106.595038667452671088",
        "cumulativeUniqueTraders": 916970
      }
    ]
  }
}
```

Query Explanation:
This is top 5 nfts by trade volume. We can see the names, symbols, royalty fee (% of money creator gets/tx), and the cum amount of eth traded for nft.

Query:
```
query MyQuery {
  collections(
    orderBy: tradeCount
    orderDirection: desc
    first: 5
    where: {symbol_not: "null"}
  ) {
    name
    symbol
    royaltyFee
    cumulativeTradeVolumeETH
  }
}
```

Response:
```
{
  "data": {
    "collections": [
      {
        "name": "parallel",
        "symbol": "LL",
        "royaltyFee": "10",
        "cumulativeTradeVolumeETH": "4809.201184202214121554"
      },
      {
        "name": "Genuine Undead",
        "symbol": "GU",
        "royaltyFee": "0.0000000000000002512562814070351758793969849246231",
        "cumulativeTradeVolumeETH": "6772.705527109701636061"
      },
      {
        "name": "OpenSea Shared Storefront",
        "symbol": "OPENSTORE",
        "royaltyFee": "10",
        "cumulativeTradeVolumeETH": "35433.344589007421147626"
      },
      {
        "name": "Moonrunners",
        "symbol": "MOONR",
        "royaltyFee": "0.00000000000000196078431372549019607843137254902",
        "cumulativeTradeVolumeETH": "8792.995721863000307366"
      },
      {
        "name": "y00ts Yacht Club",
        "symbol": "YYC",
        "royaltyFee": "5",
        "cumulativeTradeVolumeETH": "1652.14967773093550554"
      }
    ]
  }
}
```

Query Explanation:
This is most recent tx of BAYC token (bored apes). We can see tx hash, amount of tokens transferred, seller, buyer, and price. Can type tx hash in etherscan like for the first tx in the response: https://etherscan.io/tx/0xe89d4e94994f91ccb483db13281cbca69a4beb584a29db5db2d36d498bdc9adc

Query:
```
query MyQuery {
  collections(
    orderBy: totalRevenueETH
    orderDirection: desc
    first: 1
    where: {symbol: "BAYC"}
  ) {
    symbol
    cumulativeTradeVolumeETH
    nftStandard
    trades(first: 5, orderBy: timestamp, orderDirection: desc) {
      seller
      buyer
      timestamp
      transactionHash
      amount
      priceETH
    }
  }
}
```

Response:
```
{
  "data": {
    "collections": [
      {
        "symbol": "BAYC",
        "cumulativeTradeVolumeETH": "149243.115016887658608855",
        "nftStandard": "ERC721",
        "trades": [
          {
            "seller": "0x79984b0a2ac682c5d2257b56215de45b965b9216",
            "buyer": "0xaeaee46b9ad8e1e213cf6d73b7b31ab19a2bb9be",
            "timestamp": "1667070695",
            "transactionHash": "0xe89d4e94994f91ccb483db13281cbca69a4beb584a29db5db2d36d498bdc9adc",
            "amount": "1",
            "priceETH": "67.3367"
          },
          {
            "seller": "0x500e91aca8cfe3e541aa47fafcd85a65bcb860f8",
            "buyer": "0x5af278b1c423a320425cd46f3f6e9c08c814bf86",
            "timestamp": "1667013887",
            "transactionHash": "0xf64ee7195e301ab055243b9c9dfc6fa3172c0b727edb274e2cf64497a7cd0488",
            "amount": "1",
            "priceETH": "74"
          },
          {
            "seller": "0xc29af06142138f893e3f1c1d11aa98c3313b8c1f",
            "buyer": "0x5620dac57a8a91b51932943bb53ffef6fd68b16c",
            "timestamp": "1666939859",
            "transactionHash": "0xbe9991d21acdfefaf21839e2360dc335d051020bced053db8cb6d7dfa3b89e1e",
            "amount": "1",
            "priceETH": "75"
          },
          {
            "seller": "0xd00c66f16e00f990c85bbd76b3118878b904bef7",
            "buyer": "0x5620dac57a8a91b51932943bb53ffef6fd68b16c",
            "timestamp": "1666939859",
            "transactionHash": "0xbe9991d21acdfefaf21839e2360dc335d051020bced053db8cb6d7dfa3b89e1e",
            "amount": "1",
            "priceETH": "74.98"
          },
          {
            "seller": "0x799604c8fd473dd9c708bc2de58fb7edacdc496e",
            "buyer": "0x5620dac57a8a91b51932943bb53ffef6fd68b16c",
            "timestamp": "1666939859",
            "transactionHash": "0xbe9991d21acdfefaf21839e2360dc335d051020bced053db8cb6d7dfa3b89e1e",
            "amount": "1",
            "priceETH": "73.8"
          }
        ]
      }
    ]
  }
}
```

## Unit Tests
We implemented 84 tests that provide full coverage on 19 out of the 20 functions we implemented with the last function being the top-level function that calls the other subroutines that make up the 19 functions with coverage.

Steps to run the tests:
1. Navigate to `opensea-marketplace-indexer` subfolder in the terminal
2. Run `graph test` from the command line

<img width="1172" alt="Screen Shot 2023-05-08 at 8 12 43 PM" src="https://user-images.githubusercontent.com/3409279/236969165-3617b36f-9c41-4271-8d9d-96421a5d7dbe.png">
