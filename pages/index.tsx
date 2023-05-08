
// /* eslint-disable @next/next/no-img-element */

import type { NextPage } from 'next';
import { BaseLayout, NftList } from '@ui';
// import { useNetwork } from '@hooks/web3';
// import { ExclamationIcon } from '@heroicons/react/solid';
import nfts from "../content/meta.json";
import { NftMeta } from '../types/nft';
import { Space, Typography, Card } from 'antd';
import {SmileOutlined} from "@ant-design/icons";


const Home: NextPage = () => {
  // const { network } = useNetwork();

  return (
    <BaseLayout>
      <div className="NFTcontent">
          <Space direction='vertical'>
            <Card style={{width:1300}}>
              <Space direction='horizontal'>
                <SmileOutlined style={{ fontSize: 50}}/>
                <Typography.Title level={5} style={{paddingLeft: '8px'}} >
                  Lily and Evelyn's Pixel NFT Market is a unique online platform for buying and selling digital artwork. 
                  Our marketplace features a wide selection of exclusive pixel art created by some of the most talented artists from around the world. 
                  Whether you're an artist looking to showcase your work or a collector looking to add to your collection, Lily and Evelyn's Pixel NFT Market is the perfect place to do it.
                  Join us today and experience the excitement of owning a piece of digital art that is truly one-of-a-kind!
                </Typography.Title>
              </Space>
            </Card>
            <NftList
              nfts={nfts as NftMeta[]}
            />
          </Space>
      </div>
    </BaseLayout>
  )
}

export default Home
