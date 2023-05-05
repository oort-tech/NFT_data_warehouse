import flask
import ariadne
import ariadne.constants
import ariadne.explorer
import json
import web3

# These will grow complex.
class account:
	def __init__(self,id:str):
		self.id=id

	def to_dict(self)->dict:
		return {"id":self.id}
		
class contract:
	def __init__(self,id:str):
		self.id=id

	def to_dict(self)->dict:
		return {"id":self.id}

gql_schema_text="""schema
{
	query: Query
}

type Account
{
	id: String!
}

type Contract
{
	id: String!
}

type Query
{
	accounts: [Account]
	contracts: [Contract]
}
"""

# Load configuration
try:
	fn=open("config.json",'r')
	config_text=fn.read()
	fn.close()
	config_dict=json.loads(config_text)
except:
	config_dict={"provider":"http","address":"localhost:8545"}
	print("Warning: Configuration file is missing! Using default configuration...")

# Initialize ETH-Node Connection
eth_node_provider_dict={"http":web3.Web3.HTTPProvider,"ws":web3.Web3.WebsocketProvider}
eth_node_address=config_dict["address"]
eth_node_provider=config_dict["provider"]

if eth_node_provider in eth_node_provider_dict:
	eth_node=web3.Web3(eth_node_provider_dict[eth_node_provider]("{}://{}".format(eth_node_provider,eth_node_address)))
else:
	print("Unknown ETH-Node provider: {}!".format(eth_node_provider))
	exit(1)

if eth_node.is_connected():
	print("Connected to ETH-Node Provider Server!")
else:
	print("Error: Failed to connect to ETH-Node Provider Server!")

# Initialize Accounts
accounts:list[account]=[]
for acc in eth_node.eth.accounts:
	accounts.append(account(acc))

# Initialize Contracts
contracts:list[contract]=[]

# Resolver Functions
def account_resolver(_,info:ariadne.resolvers.GraphQLResolveInfo)->str:
	acc:account
	return [acc.to_dict() for acc in accounts]

def contract_resolver(_,info:ariadne.resolvers.GraphQLResolveInfo)->str:
	ctr:contract
	return [ctr.to_dict() for ctr in contracts]

# Initialize the resolvers
query=ariadne.QueryType()
query.set_field("accounts",account_resolver)
query.set_field("contracts",contract_resolver)
gql_schema=ariadne.make_executable_schema(gql_schema_text,query)

# Initialize Flask HTTP Server
app=flask.Flask(__name__)

@app.route("/graphql",methods=["POST"])
def graphql_server():
	data=flask.request.get_json()
	success,result=ariadne.graphql_sync(gql_schema,data,context_value=flask.request,debug=app.debug)
	return json.dumps(result,indent='\t')+'\n',200 if success else 400

@app.route("/graphql",methods=["GET"])
def graphql_playground():
	return ariadne.explorer.ExplorerGraphiQL("ELEN E6883").html("Nothing")