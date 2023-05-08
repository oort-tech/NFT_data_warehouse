import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Form, Button } from 'react-bootstrap'
import img_place_holder from './DOGE_PlaceHolder.jpg'


export default function MyStorage({ marketplace, account }) {
  const [loading, setLoading] = useState(true)
  const [myItems, setMyItems] = useState([])
  const [receiver, setReceiver] = useState('')
  const [price, setPrice] = useState(null)
  const [tokenId, setTokenId] = useState(null)


  const transferNFT  = async () => {
    if ( !tokenId || !receiver ) return
    try{
        await(await marketplace.transferNFT(tokenId, receiver)).wait()
        loadMyStorage()
    }
    catch(error) {
        console.log("ipfs uri upload error: ", error)
      }
  }

  const listNFTForSale  = async () => {
    if ( !tokenId || !price ) return
    try{
        await(await marketplace.listNFTForSale(tokenId, ethers.utils.parseEther(price.toString()))).wait()
        loadMyStorage()
    }
    catch(error) {
        console.log("ipfs uri upload error: ", error)
      }
  }

  const loadMyStorage = async () => {
    // Load all items that the user has
    const itemCount = await marketplace.tokenCount()
    let myItems = []
    for (let indx = 1; indx <= itemCount; indx++) {
      const i = await marketplace.items(indx)
      if (i.owner.toLowerCase() === account && !(i.onsale)) {
        // get uri url from nft contract
        const uri = await marketplace.tokenURI(indx)
        let item = {
            uri: uri,
            tokenId: i.tokenId,
            nameId: i.nameId,
            name: i.name,
            description: i.description
        }
        myItems.push(item)
      }
    }
    setLoading(false)
    setMyItems(myItems)
  }
  useEffect(() => {
    loadMyStorage()
  }, [])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )
  return (
    <div className="flex justify-center">
      {myItems.length > 0 ?
        <div className="px-5 py-3 container">
            <h2>My Storage</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {myItems.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card onClick={() => setTokenId(item.tokenId)}>
                    <Card.Header> {(item.tokenId == tokenId)? 'Selected':'Name'}: {item.name}</Card.Header>
                  <Card.Img variant="top" src={img_place_holder} />
                  <Card.Footer>Link to image: {item.uri}</Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
            <div className="content mx-auto">
            <Form.Control onChange={(e) => setReceiver(e.target.value)} size="lg" required type="text" placeholder="Receiver Address" />
            <div className="d-grid px-0">
                <Button onClick={transferNFT} variant="primary" size="lg">
                  Transfer the NFT
                </Button>
              </div>
            <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price" />
            <div className="d-grid px-0">
                <Button onClick={listNFTForSale} variant="primary" size="lg">
                  List the NFT for sale!
                </Button>
              </div>
            </div>
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No NFT in the storage space</h2>
          </main>
        )}
    </div>
  );
}