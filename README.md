# FinalProject_NFTmarketPlace_6883 - Topic 1 NFT Marketplace

## Github Structure
### Top Level
    - .gitignore
    - package.json
    - hardhat.config.js
    - README.md
    - src                                       (This folder contains the code for frontend & backend)
          - backend                                 (This folder contains the code for backend)
                - contract                              (This folder contains the code for NFT_Marketplace smart contract)
                      - NFT_Marketplace.sol                 (This file implements the NFT_Marketplace smart contract)
                - scripts                               (This folder contains the code to deploy the smart contract onto the blockchain)
                      - deploy.js                           (This file deploys the NFT_Marketplace smart contract onto the blockchain)
                - test                                  (This folder contains the test bench code)
                      - NFTMarketplace.test.js              (This file contains the test bech code)
          - frontend                            (This folder contains the code for frontend)
                - components                        (This folder contains the code for the frontend Web App)
                - contractsData                     (This folder contains blockchain information passed to the frontend Wen App)
 
  node,js - v16.20.0  <br>
  METAMASK  <br>
 
 
1. npm install
2. npm install --save-dev hardhat@2.8.4
3. npm install react-router-dom@6
4. npm install ipfs-http-client@56.0.1
5. npm i @openzeppelin/contracts@4.5.0

Run testbench:  <br>
 npx hardhat test  <br>
 
GUI:  <br>
 1. npx hardhat node     (log the testing accounts @ keys)
 2. open a new terminal, run: npx hardhat run src\backend\scripts\deploy.js --network localhost
 3. open a new terminal, run: npm run start     (Should open a GUI webpage the browser)
 4. open METAMASK on the browser, create and connect to Hardhat Node using the following setup:  <br>
      Network Name: Hardhat Node  <br>
      New RPC URL: http://127.0.0.1:8545  <br>
      Chain ID: 31337  <br>
      Currency symbol: ETH  <br>
      if previously connected to the Hardhat Node, disconnect the blockchain and reconnect.  <br>
      Should also remove all the previous test accounts, after adding new test accounts, follow this instruction and make sure the
      accounts are reset:
      https://medium.com/@thelasthash/solved-nonce-too-high-error-with-metamask-and-hardhat-adc66f092cd  <br>
 5. Import the testing accounts to METAMASK using corresponding private keys
 6. In the GUI webpage, click "Connect Wallte", select which account to connect in the METAMASK's prompt
 7. Create, send, buy and sell NFT using the GUI
 8. To switch to another testing account, open "Connected sites" page in the METAMASK account tabe, disconnect the localhost page, refresh the webpage and connect using another account. 

![alt text](/GUI_Sample.png)
