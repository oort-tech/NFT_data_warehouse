import { Address, BigInt, BigDecimal, log} from '@graphprotocol/graph-ts'
import { User, NFT } from '../../generated/schema'

export function getOrCreateUser(address: Address): User {
	let id = address.toHexString()
	let account = User.load(id)
	if (!account) {
		account = new User(id)
		account.salesNum = BigInt.fromI32(0)
		account.purchasesNum = BigInt.fromI32(0)
		account.spent = new BigDecimal(BigInt.fromI32(0))
		account.earned = new BigDecimal(BigInt.fromI32(0))
		//account.nftOwneds = []
		account.save()
	}

	return account as User
}

export function updateSellerAggregates(
	seller: User,
	price: BigDecimal
): void {
	seller.salesNum = seller.salesNum.plus(BigInt.fromI32(1))
	seller.earned = seller.earned.plus(price)
}

export function updateBuyerAggregates(buyer: User, price: BigDecimal): void {
	buyer.spent = buyer.spent.plus(price)
	buyer.purchasesNum = buyer.purchasesNum.plus(BigInt.fromI32(1))
}
