import {
  Link,
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import { useState } from 'react'
import { ethers } from 'ethers'
import ImageNFTMarketplaceAbi from '../contractsData/PaintingNFTContract.json'
import ImageNFTMarketplaceAddress from '../contractsData/PaintingNFTContract-address.json'
import { Spinner, Navbar, Nav, Button, Container } from 'react-bootstrap'
import Home from './Home.js'
import CreateNFT from './CreateNFT';
import MyImages from './MyImages'
import MySellings from './MySellings'

function App() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [contract, setContract] = useState({})

  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0])

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    loadContract(signer)
  }
  const loadContract = async (signer) => {
    const contract = new ethers.Contract(ImageNFTMarketplaceAddress.address, ImageNFTMarketplaceAbi.abi, signer)
    setContract(contract)
    setLoading(false)
  }
  return (
    <BrowserRouter>
      <div className="App">
        <>
          <Navbar expand="lg" bg="dark" variant="dark">
            <Container>
              <Navbar.Toggle aria-controls="responsive-navbar-nav" />
              <Navbar.Collapse id="responsive-navbar-nav">
                <Nav className="me-auto">
                  <Nav.Link as={Link} to="/">Home</Nav.Link>
                  <Nav.Link as={Link} to="/create-nft">Create NFT</Nav.Link>
                  <Nav.Link as={Link} to="/my-images">My Images</Nav.Link>
                  <Nav.Link as={Link} to="/my-sellings">My Sellings</Nav.Link>
                </Nav>
                <Nav>
                  {account ? (
                    <Nav.Link
                      href={`https://etherscan.io/address/${account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button nav-button btn-sm mx-4">
                      <Button variant="outline-light">
                        {account.slice(0, 5) + '...' + account.slice(38, 42)}
                      </Button>

                    </Nav.Link>
                  ) : (
                    <Button onClick={web3Handler} variant="outline-light">Connect Wallet</Button>
                  )}
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        </>
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <Spinner animation="border" style={{ display: 'flex' }} />
              <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={
                <Home contract={contract} account={account}/>
              } />
              <Route path="/create-nft" element={
                <CreateNFT contract={contract} />
              } />
              <Route path="/my-images" element={
                <MyImages contract={contract} />
              } />
              <Route path="/my-sellings" element={
                <MySellings contract={contract} account={account} />
              } />
            </Routes>
          )}
        </div>
      </div>
    </BrowserRouter>

  );
}

export default App;