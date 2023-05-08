
import type { NextPage } from 'next'
import { ChangeEvent, useState } from 'react';
import { BaseLayout } from '@ui'
// import { Switch } from '@headlessui/react'
import Link from 'next/link'
import { NftMeta, PinataRes } from '@_types/nft';
import axios from 'axios';
import { useWeb3 } from '@providers/web3';
import { ethers } from 'ethers';
import { toast } from "react-toastify";
import { useNetwork } from '@hooks/web3';
import { ExclamationIcon } from '@heroicons/react/solid';
import {Button, Space, Card} from "antd";

const ALLOWED_FIELDS = ["name", "description", "image"];

const NftCreate: NextPage = () => {
  const {ethereum, contract} = useWeb3();
  const {network} = useNetwork();
  const [nftURI, setNftURI] = useState("");
  const [price, setPrice] = useState("");
  const [hasURI, setHasURI] = useState(false);
  const [nftMeta, setNftMeta] = useState<NftMeta>({
    name: "",
    description: "",
    image: "",
    price:""
  });

  const getSignedData = async () => {
    const messageToSign = await axios.get("/api/verify");
    const accounts = await ethereum?.request({method: "eth_requestAccounts"}) as string[];
    const account = accounts[0];

    const signedData = await ethereum?.request({
      method: "personal_sign",
      params: [JSON.stringify(messageToSign.data), account, messageToSign.data.id]
    })

    return {signedData, account};
  }

  const handleImage = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      console.error("Select a file");
      return;
    }

    const file = e.target.files[0];
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    try {
      const {signedData, account} = await getSignedData();
      const promise = axios.post("/api/verify-image", {
        address: account,
        signature: signedData,
        bytes,
        contentType: file.type,
        fileName: file.name.replace(/\.[^/.]+$/, "")
      });

      const res = await toast.promise(
        promise, {
          pending: "Uploading image",
          success: "Image uploaded",
          error: "Image upload error"
        }
      )

      const data = res.data as PinataRes;

      setNftMeta({
        ...nftMeta,
        image: `${process.env.NEXT_PUBLIC_PINATA_DOMAIN}/ipfs/${data.IpfsHash}`
      });
    } catch(e: any) {
      console.error(e.message);
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNftMeta({...nftMeta, [name]: value});
  }

  

  const uploadMetadata = async () => {
    try {
      const {signedData, account} = await getSignedData();

      const promise = axios.post("/api/verify", {
        address: account,
        signature: signedData,
        nft: nftMeta
      })

      const res = await toast.promise(
        promise, {
          pending: "Uploading metadata",
          success: "Metadata uploaded",
          error: "Metadata upload error"
        }
      )

      const data = res.data as PinataRes;
      setNftURI(`${process.env.NEXT_PUBLIC_PINATA_DOMAIN}/ipfs/${data.IpfsHash}`);
    } catch (e: any) {
      console.error(e.message);
    }
  }

  const createNft = async () => {
    try {
      const nftRes = await axios.get(nftURI);
      const content = nftRes.data;

      Object.keys(content).forEach(key => {
        if (!ALLOWED_FIELDS.includes(key)) {
          throw new Error("Invalid Json structure");
        }
      })

      const tx = await contract?.mintToken(
        nftURI,
        ethers.utils.parseEther(price), {
          value: ethers.utils.parseEther(0.025.toString())
        }
      );
      
      await toast.promise(
        tx!.wait(), {
          pending: "Minting Nft Token",
          success: "Nft has ben created",
          error: "Minting error"
        }
      );
    } catch(e: any) {
      console.error(e.message);
    }
  }

  if (!network.isConnectedToNetwork) {
    return (
      <BaseLayout>
        <div className="rounded-md bg-yellow-50 p-4 mt-10">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Attention needed</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                { network.isLoading ?
                  "Loading..." :
                  `Connect to ${network.targetNetwork}`
                }
                </p >
              </div>
            </div>
          </div>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>
      <div>
     
        { (nftURI || hasURI) ?
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">List NFT</h3>
                <p className="mt-1 text-sm text-gray-600">
                  This information will be displayed publicly so be careful what you share.
                </p >
              </div>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <form>
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  { hasURI &&
                    <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                      <div>
                        <label htmlFor="uri" className="block text-sm font-medium text-gray-700">
                          URI Link
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            onChange={(e) => setNftURI(e.target.value)}
                            type="text"
                            name="uri"
                            id="uri"
                            className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                            placeholder="http://link.com/data.json"
                          />
                        </div>
                      </div>
                    </div>
                  }
                  { nftURI &&
                    <div className='mb-4 p-4'>
                      <div className="font-bold">Your metadata: </div>
                      <div>
                        <Link href={nftURI}>
                          <a className="underline text-indigo-600">
                            {nftURI}
                          </ a>
                        </Link>
                      </div>
                    </div>
                  }
                  <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Price (ETH)
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          onChange={(e) => setPrice(e.target.value)}
                          value={price}
                          type="number"
                          name="price"
                          id="price"
                          className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                          placeholder="0.8"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <Button
                      onClick={createNft}
                    >
                      List
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        :
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <Space direction="vertical">
            <Space style={{paddingLeft: '450px',paddingTop:'20px'}}>
              <Card style={{width:600, borderColor: "lightblue", borderWidth:'2px'}}>
                <div className="px-4 sm:px-0">
                  <h3 className="text-lg font-medium leading-6 text-gray-900"> Generate metadata for your NFT</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Please note that the information you provide will be visible to the public, so it is important to be mindful of what you choose to share.
                  </p >
                </div>
            </Card>
            </Space>
            <Space style={{paddingLeft: '450px',paddingTop:'20px'}}>
              <Card style={{width:600, backgroundColor: "lightblue" }}>
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          value={nftMeta.name}
                          onChange={handleChange}
                          type="text"
                          name="name"
                          id="name"
                          className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                          placeholder="New NFT"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          value={nftMeta.description}
                          onChange={handleChange}
                          id="description"
                          name="description"
                          rows={3}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                          
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Brief description of NFT
                      </p >
                    </div>
                    {/* Has Image? */}
                    { nftMeta.image ?
                      < img src={nftMeta.image} alt="" className="h-40" /> :
                      <div>
                      <label className="block text-sm font-medium text-gray-700">Image</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                            >
                              <span>Upload a file</span>
                              <input
                                onChange={handleImage}
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p >
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p >
                        </div>
                      </div>
                    </div>
                    }
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <Button
                      onClick={uploadMetadata}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              </Card>
            </Space>
          </Space>

        </div>
        }
      </div>
    </BaseLayout>
  )
}

export default NftCreate