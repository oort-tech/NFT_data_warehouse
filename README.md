# NFT_marketplace

## 1 Environment Setup
Installing Node.js
MacOS
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 18
nvm use 18
nvm alias default 18
npm install npm --global # Upgrade npm to the latest version
```

## 2 Hardhat setup
```
npm install --save-dev hardhat
npx hardhat
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

## 3 Compling Contracts
```
$ npx hardhat compile
Compiling 1 file with 0.8.9
Compilation finished successfully
```

## 4 Testing contracts
```
npx hardhat test
```

## 5 Deploying to a live network
```
npx hardhat run scripts/deploy.js --network <network-name>
```
In our Implementation, sepolia is used for deployment, see <mark>hardhat.config.js</mark>

