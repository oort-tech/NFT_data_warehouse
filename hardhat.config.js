require("@nomicfoundation/hardhat-toolbox");

// Go to https://infura.io, sign up, create a new API key
// in its dashboard, and replace "KEY" with it
const INFURA_API_KEY = "05f0761ce3f748118beb06824bd0df41";

// Replace this private key with your Sepolia account private key
// To export your private key from Coinbase Wallet, go to
// Settings > Developer Settings > Show private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Beware: NEVER put real Ether into testing accounts
const SEPOLIA_PRIVATE_KEY = "f78e12089ad273bfd0761cab546d7f5811a1212ffdc8361f711f5f55ae839410";
const LOCALHOST_PRIVATE_KEY = "0xd6515b7ca2a9696a2347218d123115f97d8fd90ca8f8c61a30e4e1a4eef238b5";

module.exports = {
  solidity: "0.8.18",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY]
    },
    localhost: {
      url: 'HTTP://127.0.0.1:7545',
      accounts: [LOCALHOST_PRIVATE_KEY]
    }
  }
};