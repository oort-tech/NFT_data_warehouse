import { BigDecimal, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { User, Collection, Transcation, NFT } from '../../generated/schema'
import GlobalConstants from '../utils'

export function getOrCreateSale(event: ethereum.Event, nft: NFT): Transcation {
	let sale = Transcation.load(GlobalConstants.globalId(event))
	if (!sale) {
		sale = new Transcation(GlobalConstants.globalId(event))
		sale.timestamp = event.block.timestamp
		sale.txHash = event.transaction.hash
		sale.blockHash = event.block.hash
		sale.logNumber = event.logIndex
		sale.blockNumber = event.block.number
		sale.nft = nft.id
		sale.eventType = 'SALE'
	}
	return sale as Transcation
}

export function updateSale(
	sale: Transcation,
	buyHash: Bytes,
	sellHash: Bytes,
	buyer: User,
	seller: User,
	price: BigDecimal,
	collection: Collection
): void {
	sale.buyHash = buyHash
	sale.sellHash = sellHash
	sale.seller = seller.id
	sale.buyer = buyer.id
	sale.price = price
	sale.collection = collection.id
}
