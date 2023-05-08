import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Form, Button } from 'react-bootstrap'
import img_place_holder from './DOGE_PlaceHolder.jpg'


export default function MyList({ marketplace, account }) {
  const [loading, setLoading] = useState(true)
  const [myList, setMyList] = useState([])


  const removeNFTFromSale = async (tokenId) => {
    if (!tokenId) return
    try{
        await(await marketplace.removeNFTFromSale(tokenId)).wait()
        loadMyList()
    }
    catch(error) {
        console.log("ipfs uri upload error: ", error)
      }
  }

  const loadMyList = async () => {
    // Load all items that the user has
    const itemCount = await marketplace.tokenCount()
    let myList = []
    for (let indx = 1; indx <= itemCount; indx++) {
      const i = await marketplace.items(indx)
      if (i.owner.toLowerCase() === account && i.onsale) {
        // get uri url from nft contract
        const uri = await marketplace.tokenURI(indx)
        const total_p = await marketplace.getTotalPrice(i.tokenId)
        let item = {
            uri: uri,
            tokenId: i.tokenId,
            nameId: i.nameId,
            name: i.name,
            description: i.description,
            totalPrice: total_p
        }
        myList.push(item)
      }
    }
    setLoading(false)
    setMyList(myList)
  }
  useEffect(() => {
    loadMyList()
  }, [])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )
  return (
    <div className="flex justify-center">
      {myList.length > 0 ?
        <div className="px-5 py-3 container">
            <h2>My Listed NFT</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {myList.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                    <Card.Header> Name: {item.name}</Card.Header>
                  <Card.Img variant="top" src={img_place_holder} />
                  <div className='d-grid'>
                      <Button onClick={() => removeNFTFromSale(item.tokenId.toNumber())} variant="primary" size="lg">
                        Recall this NFT
                      </Button>
                    </div>
                  <Card.Footer>Price: {ethers.utils.formatEther(item.totalPrice)} ETH</Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No NFT in the storage space</h2>
          </main>
        )}
    </div>
  );
}