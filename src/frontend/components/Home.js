import { useEffect, useState } from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { ethers } from 'ethers';

const Home = ({ contract, account }) => {
  const [unsoldNFTs, setUnsoldNFTs] = useState([]);

  useEffect(() => {
    const fetchUnsoldNFTs = async () => {
      try {
        const nfts = await contract.getUnsoldNFT();
        const formattedNFTs = nfts.map(nft => ({
          tokenId: nft.tokenId.toString(),
          owner: nft.owner,
          price: ethers.utils.formatEther(nft.price), 
          URI: nft.URI
        }));
        setUnsoldNFTs(formattedNFTs);
      } catch (error) {
        console.error('Error fetching unsold NFTs:', error);
      }
    };

    fetchUnsoldNFTs();
  }, [contract, account]);

  const buyNFT = async (tokenId, price) => {
    try {
      if (typeof account !== 'undefined') {
        const priceInWei = ethers.utils.parseUnits(price, 'ether');
        const taxInWei = await contract.tax();
        const totalInWei = priceInWei.add(taxInWei);

        const tx = await contract.buyNFT(tokenId, priceInWei, { value: totalInWei });
        await tx.wait();
        alert('NFT purchased successfully!');
      } else {
        alert('Please connect your wallet to buy NFTs!');
      }
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      alert('Error purchasing NFT. Check the console for more details.');
    }
  };

  return (
    <div className="container mt-5">
      {unsoldNFTs.length === 0 ? (
        <h3>No images you can buy</h3>
      ) : (
        <Row>
          {unsoldNFTs.map((nft) => (
            <Col key={nft.tokenId.toString()} md={4} className="mb-3">
              <Card style={{ width: '18rem' }}>
                <Card.Img variant="top" src={nft.URI} />
                <Card.Body>
                  <Card.Title>Token ID: {nft.tokenId.toString()}</Card.Title>
                  <Card.Text>Price: {nft.price} ETH</Card.Text>
                  <Button variant="secondary" onClick={() => buyNFT(nft.tokenId, nft.price)}>
                    Buy NFT
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Home;
