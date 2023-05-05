import web3
# Note: this file is intended for playground of Ethereum network...

def print_users():
	for acc in w3.eth.accounts:
		print("ETH Account: {}".format(acc))
		balance=w3.from_wei(w3.eth.get_balance(acc),"ether")
		print("Balance: {}".format(balance))
		

# Ganache's network.
# w3=web3.Web3(web3.Web3.HTTPProvider("http://localhost:8545"))
# OpenEthereum's network.
w3=web3.Web3(web3.Web3.WebsocketProvider("ws://localhost:8546"))
# Web3.py Tester network.
# w3=web3.Web3(web3.Web3.EthereumTesterProvider())
print(w3.is_connected())
print_users()
blk=w3.eth.get_block("latest",True)
for tx in blk.transactions:
	print(tx)
tx_hash=w3.eth.send_transaction({"from":w3.eth.accounts[0],"to":w3.eth.accounts[1],"value":w3.to_wei(3,"ether")})
print_users()
blk=w3.eth.get_block("latest",True)
for tx in blk.transactions:
	print("From: {} To: {}".format(tx['from'],tx['to']))