/* eslint-disable @next/next/no-img-element */

import { FunctionComponent } from "react";
import { NftMeta, Nft } from "../../../../types/nft";
import {Button, Space} from "antd";
import {HeartOutlined, LikeOutlined} from "@ant-design/icons";

type NftItemProps = {
  item: NftMeta;
  // buyNft: (token: number, value: number) => Promise<void>;
}

// function shortifyAddress(address: string) {
//   return `0x****${address.slice(-4)}`
// }

const NftItem: FunctionComponent<NftItemProps> = ({item}) => {
  return (
    <>
      <Space direction="vertical">
        <Space>
          <img 
            className={`object-cover`}
            src={item.image}
            alt="New NFT"
            width={300}
          />
        </Space>
        <Space direction="vertical">
          <div className="flex-1">
            <div className="block mt-2">
              <p className="text-l font-semibold text-gray-900">{item.name}</p>
              <p className="text-l text-gray-500">{item.description}</p>
              <Space direction="horizontal">
                <p className="text-l text-grey-500 pt-4 pb-4">Price:</p>
                <p className="text-l font-semibold text-purple-500 pt-4 pb-4">{item.price}</p>
              </Space>
            </div>
          </div>

          <Space direction="horizontal">
            <Button>
              Purchase
            </Button>
            <Button>
              <HeartOutlined />
            </Button>
            <Button>
              <LikeOutlined />
            </Button>
          </Space>
        </Space>
      </Space>
    </>
  )
}
export default NftItem;