

import { FunctionComponent } from "react";
import { NftMeta, Nft } from "../../../../types/nft"
import NftItem from "../item";
import {Space, Card} from "antd";
type NftListProps = {
  nfts: NftMeta[]
}
const NftList: FunctionComponent<NftListProps> = ({nfts}) => {
  return (
    <Space direction="horizontal">
      {nfts.map(nft =>
        <Card style={{width: 300, height:500}} key={nft.image}>
          <NftItem
            item={nft}
          />
        </Card>
      )}
    </Space>
  )
}
export default NftList;