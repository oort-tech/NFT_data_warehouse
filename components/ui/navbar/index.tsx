/* eslint-disable @next/next/no-img-element */

import { Disclosure } from '@headlessui/react';
import { useAccount, useNetwork } from '@hooks/web3';
import Walletbar from './Walletbar';
import { Space, Typography } from 'antd';


export default function Navbar() {
  const { account } = useAccount();
  const { network } = useNetwork();

  return (
    <Disclosure as="nav" className="bg-gray-800">
      {({ open }) => (
        <>
          <div className = "MarketHeader">
            <Space direction="horizontal">
              <Typography.Title style={{ color: "white", textAlign: "center"}}>
                Lily and Evelyn's NFT Pixel Market
              </Typography.Title>
              <Space className="NetworkName" direction="horizontal">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-purple-100 text-purple-800">
                  { network.isLoading ?
                    "Loading..." :
                    account.isInstalled ?
                    network.data :
                    "Install Web3 Wallet"
                  }
                </span>
                <Walletbar
                isInstalled={account.isInstalled}
                isLoading={account.isLoading}
                connect={account.connect}
                account={account.data}
              />
              </Space>
            </Space>
          </div>
        </>    
      )}
    </Disclosure>
  )
}
