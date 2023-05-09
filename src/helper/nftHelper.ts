import { Address, BigInt } from '@graphprotocol/graph-ts'
import { User, Collection, NFT, Transcation } from '../../generated/schema'
import GlobalConstants from '../utils'

export function getOrCreateNft(
	tokenId: BigInt,
	collection: Collection,
	owner: Address
): NFT {
	let nft = NFT.load(collection.id.concat('-').concat(tokenId.toString()))
	if (!nft) {
		nft = new NFT(collection.id.concat('-').concat(tokenId.toString()))
		nft.tokenID = tokenId
		nft.owner = owner.toHexString()
		nft.salesNum = GlobalConstants.BI_ZERO
	}
	return nft
}

export function updateNftMetrics(
	buyer: User,
	sale: Transcation,
	tokenId: BigInt,
	collection: Collection,
	nft: NFT
): void {
	nft.owner = buyer.id
	nft.transcation = sale.id
	nft.tokenID = tokenId
	nft.collection = collection.id
	nft.salesNum = nft.salesNum.plus(GlobalConstants.BI_ONE)
	//buyer.nftOwneds = buyer.nftOwneds.concat([nft])
}
