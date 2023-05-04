import flask
import ariadne
import ariadne.constants
import ariadne.explorer
import json

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

# These variables are for demo queries
accounts:list[account]=[account("A"),account("B"),account("C")]
contracts:list[contract]=[contract("Z"),contract("Y"),contract("X")]

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