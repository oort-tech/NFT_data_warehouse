import { BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { User, Collection, NFT } from '../../generated/schema'
import GlobalConstants from '../utils'

export function getOrCreateCollection(id: string): Collection {
	let collection = Collection.load(id)

	if (!collection) {
		collection = new Collection(id)
		collection.totalSupply = GlobalConstants.BI_ZERO
		collection.salesMoney = GlobalConstants.BD_ZERO
		collection.salesNum = GlobalConstants.BI_ZERO

		// let collectionCall = ERC721.bind(Address.fromString(id))
		// collection.name = collectionCall._name
	}

	return collection
}

export function updateCollectionAggregates(
	collection: Collection,
	buyer: User,
	price: BigDecimal,
	nft: NFT
): void {
	collection.owner = buyer.id
	collection.salesNum = collection.salesNum.plus(
		GlobalConstants.BI_ONE
	)
	collection.salesMoney = collection.salesMoney.plus(price)
	collection.nft = nft.id
}
