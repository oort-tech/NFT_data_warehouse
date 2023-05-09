const Web3 = require('web3');

const web3 = new Web3('https://mainnet.infura.io/v3/d48da051f5424635a1ad00ebbf9d2455'); // Replace with your Infura Project ID

const ERC721_ABI = [
  // ERC721 Metadata interface
  {
    constant: true,
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  // ERC721 interface
  {
    constant: true,
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  // ERC721 Name interface
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  // Transfer event
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
    type: 'event',
  },
  //NFTSold interface
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'buyer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'price',
        type: 'uint256',
      },
    ],
    name: 'NFTSold',
    type: 'event',
  }
];
const ERC1155_ABI = [
  // IERC1155MetadataURI interface
  {
    "constant": true,
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "uri",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // IERC1155 interface
  {
    "constant": true,
    "inputs": [
      {
        "name": "account",
        "type": "address"
      },
      {
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // TransferSingle event
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "_operator",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "_from",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "_to",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "_id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "TransferSingle",
    "type": "event"
  },
  // IERC165 interface
  {
    "constant": true,
    "inputs": [
      {
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // ERC1155Name interface (assuming a name function similar to ERC721)
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_id", "type": "uint256"}],
    "name": "uri",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
];

async function isERC1155Contract(contractAddress) {
  try {
    const contract = new web3.eth.Contract(ERC1155_ABI, contractAddress);
    await contract.methods.supportsInterface('0xd9b67a26').call(); // Checks if the contract supports the ERC1155 interface
    return true;
  } catch (error) {
    return false;
  }
}
async function fetchTransferEvents(contractAddress, tokenId, isERC1155) {
  try {
    const contract = new web3.eth.Contract(isERC1155 ? ERC1155_ABI : ERC721_ABI, contractAddress);
    const eventName = isERC1155 ? 'TransferSingle' : 'Transfer';
    const transferEvents = await contract.getPastEvents(eventName, {
      filter: { tokenId: tokenId },
      fromBlock: 0,
      toBlock: 'latest',
    });

    return transferEvents.map((event) => ({
      id: event.id,
      from: event.returnValues.from,
      to: event.returnValues.to,
      transactionHash: event.transactionHash,
      timestamp: null, // You'll need to fetch the timestamp using the transaction hash
    }));
  } catch (error) {
    console.error('Error fetching transfer events:', error);
    return [];
  }
}

async function getNFTSoldEvents(contractAddress) {
  const contractInstance = new web3.eth.Contract(ERC721_ABI, contractAddress);
  const events = await contractInstance.getPastEvents('NFTSold', {
    fromBlock: 0,
    toBlock: 'latest',
  });
  return events;
}

async function getNFTsWithLatestSalePrice(contractAddress, limit) {
  const soldEvents = await getNFTSoldEvents(contractAddress);
  
  // Create an object to store the latest sale price for each NFT
  const nftSalePrices = {};

  soldEvents.forEach((event) => {
    const tokenId = event.returnValues.tokenId.toString();
    const price = parseFloat(web3.utils.fromWei(event.returnValues.price, 'ether'));

    if (!nftSalePrices[tokenId] || nftSalePrices[tokenId] < price) {
      nftSalePrices[tokenId] = price;
    }
  });

  // Sort the NFTs by their latest sale price
  const sortedTokenIds = Object.keys(nftSalePrices).sort((a, b) => nftSalePrices[b] - nftSalePrices[a]);

  // Fetch NFT details for the top NFTs
  const topNFTs = [];
  for (let i = 0; i < limit && i < sortedTokenIds.length; i++) {
    const tokenId = sortedTokenIds[i];
    const nft = await getNFT(contractAddress, tokenId);
    nft.latestSalePrice = nftSalePrices[tokenId];
    topNFTs.push(nft);
  }

  return topNFTs;
}



const resolvers = {
  Query: {
    getNFT: async (_, { contractAddress, tokenId }) => {
      try {
        const isERC1155 = await isERC1155Contract(contractAddress);
        const contract = new web3.eth.Contract(isERC1155 ? ERC1155_ABI : ERC721_ABI, contractAddress);
        let tokenURI;
        let owner;
        let name;

        try {
          tokenURI = await (isERC1155 ? contract.methods.uri(tokenId).call() : contract.methods.tokenURI(tokenId).call());
        } catch (error) {
          console.error('Error fetching tokenURI:', error);
        }

        
        try {
          owner = await contract.methods.ownerOf(tokenId).call();
        } catch (error) {
          console.error('Error fetching owner:', error);
        }
        
 
        try {
          name = await contract.methods.name().call();
        } catch (error) {
          console.error('Error fetching name:', error);
        }

        return {
          id: tokenId,
          name: name,
          contractAddress: contractAddress,
          owner: owner,
          metadata: tokenURI,
        };
      } catch (error) {
        throw new Error(`Error fetching NFT data from the smart contract: ${error.message}`);
      }
    },
    topNFTsByLatestSalePrice: async (_, { contractAddress, limit }) => {
      const topNFTs = await getNFTsWithLatestSalePrice(contractAddress, limit);
      return topNFTs;
    },
  },
  NFT: {

    getSalesHistory: (parent) => fetchTransferEvents(parent.contractAddress, parent.id,parent.isERC1155), // Reusing fetchTransferEvents function for sales history
    getTransactions: (parent) => fetchTransferEvents(parent.contractAddress, parent.id,parent.isERC1155),
  },
};

module.exports = resolvers;
