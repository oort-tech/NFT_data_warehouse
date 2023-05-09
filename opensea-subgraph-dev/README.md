# SubGraph Development

## Setup
```
npm install
graph codegen
```

## Introduction
There are some sample GraphQL queries we can implement. 
Here, we show an example with GetAllAssetsFromUser () string.
This funciton will retrieve all the assets that belong to a user, taking a wallet address as an argument and using it to recover the assets associated to that address. The function will give back a bunch of objects containing information such as the asset ID, token ID, token URI, and collection details.

The query need could be:
```
query {
  user(id: "0xbfDb50Dc66C8Df9fd9688D8fe5A0C34126427645") {
    assets {
      id
      tokenId
      tokenURI
      tradeCount
      collection {
        id
        name
        symbol
        nftStandard
      }
    }
  }
}
```
Which given the owner ID spells the assets info.

In this case, the solution obatined was:

```
{
  "data": {
    "user": {
      "id": "0xF653580a71A96F0f8896f73c7008B47603F568C9 ",
      "assets": [
        {
          "id": "0x3d259c1a67efc4fa5974dc0b08754e50a546975f4c76e9797171b2205d103785",
          "collection": {
            "id": "0xf23c12c23ab0bb987f2be54c3a7a3b86a7522710",
            "name": "AKT45",
            "symbol": "AKT",
            "totalSupply": 1000,
            "nftStandard": "ERC721",
            "royaltyFee": 2.5,
            "cumulativeTradeVolumeETH": 50,
            "marketplaceRevenueETH": 2.5,
            "creatorRevenueETH": 2.5,
            "totalRevenueETH": 5,
            "tradeCount": 12
          },
          "tradeCount": 5,
          "owner": {
            "id": "0xF653580a71A96F0f8896f73c7008B47603F568C9 "
          }
        },
        {
          "id": "0xa6e0815f210e41e207251e2b3fade5e37b8d77a82f7d975b8524793404e0501e",
          "collection": {
            "id": "0xf23c12c23ab0bb987f2be54c3a7a3b86a7522710",
            "name": "AKT45",
            "symbol": "AKT",
            "totalSupply": 1000,
            "nftStandard": "ERC721",
            "royaltyFee": 2.5,
            "cumulativeTradeVolumeETH": 50,
            "marketplaceRevenueETH": 2.5,
            "creatorRevenueETH": 2.5,
            "totalRevenueETH": 5,
            "tradeCount": 10
          },
          "tradeCount": 3,
          "owner": {
            "id": "0xF653580a71A96F0f8896f73c7008B47603F568C9 "
          }
        }
      }
  }
```
With this response, we have proved that our graph schema works. We can see how the answer corresponds exactly to the schema we defined, showing our test went perfectly well.

