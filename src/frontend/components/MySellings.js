import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Card, Row, Col, Button } from 'react-bootstrap';

const MySellings = ({ contract }) => {
  const [myListedNFTs, setMyListedNFTs] = useState([]);

  useEffect(() => {
    const fetchMyListedNFTs = async () => {
      try {
        const nfts = await contract.getMyListedNFT();
        setMyListedNFTs(nfts);
      } catch (error) {
        console.error('Error fetching my listed NFTs:', error);
      }
    };

    fetchMyListedNFTs();
  }, [contract]);

  const cancelSellNFT = async (tokenId) => {
    try {
      const tx = await contract.cancelListNFT(tokenId);
      await tx.wait();
      alert('NFT removed from sale successfully!');
      setMyListedNFTs(myListedNFTs.filter((nft) => nft.tokenId !== tokenId));
    } catch (error) {
      console.error('Error cancelling NFT sale:', error);
      alert('Error cancelling NFT sale. Check the console for more details.');
    }
  };

  return (
    <div className="container mt-5">
      {myListedNFTs.length === 0 ? (
        <h3>No images on selling</h3>
      ) : (
        <Row>
          {myListedNFTs.map((nft) => (
            <Col key={nft.tokenId.toString()} md={4} className="mb-3">
              <Card style={{ width: '18rem' }}>
                <Card.Img variant="top" src={nft.URI} />
                <Card.Body>
                  <Card.Title>Token ID: {nft.tokenId.toString()}</Card.Title>
                  <Card.Text>Owner: {nft.owner}</Card.Text>
                  <Card.Text>Price: {ethers.utils.formatEther(nft.price)} ETH</Card.Text>
                  <Button variant="secondary" onClick={() => cancelSellNFT(nft.tokenId)}>Cancel Sell</Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default MySellings;
