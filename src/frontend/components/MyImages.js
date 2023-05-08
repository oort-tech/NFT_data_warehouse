import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Card, Row, Col, Button, FormControl } from 'react-bootstrap';

const MyImages = ({ contract }) => {
  const [myNFTs, setMyNFTs] = useState([]);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const fetchMyNFTs = async () => {
      try {
        const nfts = await contract.getMyNotListedNFT();
        setMyNFTs(nfts);
      } catch (error) {
        console.error('Error fetching my NFTs:', error);
      }
    };

    fetchMyNFTs();
  }, [contract]);

  const handlePriceChange = (event, tokenId) => {
    const newPrices = { ...prices };
    newPrices[tokenId] = event.target.value;
    setPrices(newPrices);
  };

  const resellNFT = async (tokenId) => {
    const price = prices[tokenId];

    if (!price || isNaN(price)) {
      alert('Please enter a valid price.');
      return;
    }

    try {
      const priceInWei = ethers.utils.parseEther(price);
      const tx = await contract.listNFT(tokenId, priceInWei);
      await tx.wait();
      alert('NFT listed for resale successfully!');
    } catch (error) {
      console.error('Error reselling NFT:', error);
      alert('Error reselling NFT. Check the console for more details.');
    }
  };

  return (
    <div className="container mt-5">
      {myNFTs.length === 0 ? (
        <h3>No images</h3>
      ) : (
        <Row>
          {myNFTs.map((nft) => (
            <Col key={nft.tokenId.toString()} md={4} className="mb-3">
              <Card style={{ width: '18rem' }}>
                <Card.Img variant="top" src={nft.URI} />
                <Card.Body>
                  <Card.Title>Token ID: {nft.tokenId.toString()}</Card.Title>
                  <Card.Text>Owner: {nft.owner}</Card.Text>
                  <FormControl
                    type="number"
                    placeholder="Enter resale price"
                    value={prices[nft.tokenId] || ''}
                    onChange={(event) => handlePriceChange(event, nft.tokenId)}
                  />
                  <Button
                    variant="secondary"
                    className="mt-2"
                    onClick={() => resellNFT(nft.tokenId)}
                  >
                    Sell NFT
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

export default MyImages;
