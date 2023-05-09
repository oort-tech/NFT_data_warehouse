There are some sample GraphQL queries we can implement. 
Here, we show an example with GetAllAssetsFromUser () string.
This funciton will retrieve all the assets that belong to a user, taking a wallet address as an argument and using it to recover thea assets associated to that address. The function will give back a bunch of objects containing information such as the asset ID, token ID, token URI, and collection details.

We first get all assets owned by a specific user:

```
query {
  user(id: "0x123...") {
    assets {
      id
      name
      description
      imageUrl
      tokenURI
    }
  }
}
```

After knowing all the assets owned, and following the Schema presented in our project, we now need to check all transactions involving a specific asset.

```
query {
  asset(id: "0x456...") {
    trades {
      transaction {
        id
        timestamp
        transactionHash
        price {
          amount
          currency {
            symbol
            decimals
          }
        }
        buyer {
          id
        }
        seller {
          id
        }
      }
    }
  }
}
```

Getting all assets of a specific collection:

```
query {
  collection(id: "0x789...") {
    assets {
      id
      name
      description
      imageUrl
      tokenURI
    }
  }
}
```

After that, the only thing left is to implement the getAllAssetsFromUser() function using the subgraph.
```
async function getAllAssetsFromUser(walletAddress) {
  const query = `
    query {
      user(id: "${walletAddress.toLowerCase()}") {
        assets {
          id
          name
          description
          imageUrl
          tokenURI
        }
      }
    }
  `;
  
  const response = await fetch('https://api.studio.thegraph.com/proxy/45684/opensea-subgraph-dcab1/v0.0.9/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  
  const result = await response.json();
  
  return result.data.user.assets;
}
```

Overall, this example shows a perfect GraphQL query that addapts to our project.
