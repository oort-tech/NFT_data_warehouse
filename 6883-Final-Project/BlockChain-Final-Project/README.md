## Final Project 
### Overview

This is the Final Project  The NFT marketplace smart contract will allow users to create, buy, sell, and trade unique digital assets represented as NFTs. The project will involve creating an ERC-721 compliant smart contract, designing a user interface for the marketplace, and implementing additional features to ensure the marketplace's security and usability.

### Team member:

Jing Wu(jw4288), Xin Fang(xf2246) and Yueyang Ying(yy3267)

### Documentation:
#### main contract:
NFTMarketplace.sol



### Installing

First, you will need to install the dependencies with: npm install.

Run the following command in your terminal after cloning the main repo:

```shell 
$ npm install 
```

Then, you will need to install Truffle globally by running the following command int your terminal:

```shell
$ npm install -g truffle
```

If you can not install suceefully, you could use:

```shell
$ sudo npm install -g truffle
```

### Running the Tests

First, you will have to compile the smart contracts by running the following command in your terminal:

```shell
$ truffle compile
```

Then you will have to install and run Ganache to run your blockchain locally:

https://www.trufflesuite.com/ganache

we provide two tests, one for local and one for online. 

### Deployment on Local Blockchain and test it locally

Deploy the contracts on your Ganache local blockchain by running the following command:

```shell
$ truffle migrate --network development
```
The tests can be executed by running the following command:

```shell
$ truffle test ./test/NFT.test.js
```

### Deployment on Online platform and test it remotely

Before test online, you need to modify related part in truffle-config.js (Metamask wallet&API key)

then, you can run following two commands:

```shell
truffle migrate --network sepolia
```

```shell
truffle test ./test/NFTOnline.test.js --network sepolia
```

And the deployment status and the contract address will be shown in terminal. You can monitor the contracts, account information on Etherscan:

https://etherscan.io/


### User Interface Interact

You can interact with our user interface by using node. You need to change your current dictionary into 

```shell
cd /frontend 
```

first, and then run:

```shell
node app.js
```

Then, go to 

http://localhost:3000

and the interface of NFT marketplace will appear in front of you.

### Contributions of Each Team Member

Jing Wu(jw4288) and Xin Fang(xf2246) are responsible for:
1. designing, implementing and testing the NFT marketplace smart contract locally. 
2. UI designing and implementing. 
3. Implementing additional features, such as access control and error handling, to ensure the contract is reliable.

Yueyang Ying(yy3267) is responsible for deploying and testing the smart contract online, to make sure that it works well not only locally but also remotely.
