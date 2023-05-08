

const instance = await NftMarket.deployed();

instance.mintToken("https://gateway.pinata.cloud/ipfs/QmSjTToR4r3BVFwh2o8etLUGpXdovLJcwHtNPHwyEZ68ti?_gl=1*1qsc8vn*rs_ga*OTVlY2EyMjYtNWViMi00NThlLTkxYjgtNzM0ZWRhNmNlOWUz*rs_ga_5RMPXG14TE*MTY4MzM5ODU1OS41LjEuMTY4MzM5ODc2NS4yNC4wLjA.","500000000000000000", {value: "25000000000000000",from: accounts[0]})
instance.mintToken("https://gateway.pinata.cloud/ipfs/QmcqxBeE2XfagzEBYnaCUfHHTRLMiHi6xap6BDFLoNUfTN","300000000000000000", {value: "25000000000000000",from: accounts[0]})