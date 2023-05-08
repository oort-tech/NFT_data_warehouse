This is a [Next.js](https://nextjs.org/) project. Full process and video lectures how to create the application can be found here: [NFT Marketplace in React, Typescript & Solidity - Full Guide
](https://academy.eincode.com/courses/nft-marketplace-in-react-js-next-typescript-full-guide)

## Overview

Marketplace has dependencies on multiple technologies.

* [Pinata](https://app.pinata.cloud/) - store images, and NFT metadata
* [Ganache](https://trufflesuite.com/ganache/) - private Blockchain, to run application localy

## To run the app
1. run `npm install` to install dependencies

2. In the root folder of the application create a `.env.development` file with following content:

```
NEXT_PUBLIC_NETWORK_ID=5777
NEXT_PUBLIC_TARGET_CHAIN_ID=1337
NEXT_PUBLIC_PINATA_DOMAIN=https://gateway.pinata.cloud

SECRET_COOKIE_PASSWORD={your custom at least 32 characters long password!}

PINATA_API_KEY={your api key from pinata}
PINATA_SECRET_API_KEY={your api secret key from pinata}
```
* (your api pinata key has to allow `pinFileToIPFS` and `pinJSONToIPFS` rules)

3. Then migrate a contract to Ganache, contract can be found in the `contracts` folder. It's called `NftMarket.sol`

* To migrate the contract run `truffle migrate` in the terminal while Ganache network is setup and running.

* Do not forget to link `trufle-config.js` with Ganache, just go to `config` and click `Add Project`

* `keys.json` must be created if you want to deploy to Ropsten, if not, just remove import of `keys.json` from `trufle-config.js` and also comment out `ropsten` configuration

4. Now everything is setup and you can test out the app.

* Run `npm run dev` in the terminal. App will run at `localhost:3000`

5. The test cases are written in the test folder. The first test case checks that a new NFT can be created and its name and description are set correctly. The second test case checks that ownership of an NFT can be transferred to another account. The third test case checks that an NFT can be listed for sale with a specific price. The fourth test case checks that an NFT can be removed from sale. The final test case checks that a successful purchase of an NFT can be executed. The fourth test case checks that only the owner of an NFT can remove it from sale.
