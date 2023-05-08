import { useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'
import { create as ipfsHttpClient } from 'ipfs-http-client'
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

const Create = ({ marketplace }) => {
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [nameId, setNameId] = useState(null)
  const [description, setDescription] = useState('')
  const uploadToIPFS = async (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    // ** IPFS now require credit card info, start from Aug 2022
    // replace the image with a place holder
    if (typeof file !== 'undefined') {
      try {
        // const result = await client.add(file)
        const result = {
          path: '',
          nameId: null,
          name: '',
          description: ''
          }
        console.log(result)
        setImage('./DOGE_PlaceHolder.jpg')
      } catch (error){
        console.log("ipfs image upload error: ", error)
      }
    }
  }
  const createNFT = async () => {
    if (!image || !name || !description || !nameId) return
    try{
      // const result = await client.add(JSON.stringify({image, nameId, name, description}))
      const result = {
        path: name,
        nameId: nameId,
        name: name,
        description: description
        }
      mintThenList(result)
    } catch(error) {
      console.log("ipfs uri upload error: ", error)
    }
  }
  const mintThenList = async (result) => {
    const uri = `https://IFPS_path_holder/w_NFT_name/${result.path}`
    // mint nft 
    await(await marketplace.createNFT(uri, result.nameId, result.name, result.description)).wait()
    // get tokenId of new nft 
    const id = await marketplace.tokenCount()
    // add nft to marketplace
  }
  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control onChange={(e) => setNameId(e.target.value)} size="lg" required type="number" placeholder="Set a ID" />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create