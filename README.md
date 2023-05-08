# Ether Painting: an NFT painting displayer based on blockchain

**Xuechen Zhou (xz3153) **

**Danling Wei (dw3033) **

**Yongjie Fu (yf2578) **

**Yu Wu (yw3748) **

**Tong Wu (tw2906)**



### Execution Guideline:

```cmd
npx hardhat node
```

- It will generate 20 virtual accounts for testing. 

  - Open the MetaMask in browser
  - Add new network with the following settings:
    - Network Name: Hardhat
  
    - New RPC URL: http://127.0.0.1:8545
  
  - Chain ID: 31337
  
    - Currency symbol: ETH
  - Switch to Hardhat Network and import some accounts generated above for testing

```cmd
npm run deploy
```

- It will deploy the contract

```
npm run start
```

- It will start the React front end

- After connect to the wallet, you can create, sell, buy, list, cancel list NFTs