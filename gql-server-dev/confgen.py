import json
# This CLI program is intended for generating configuration for the server.

if __name__=="__main__":
	server_type_dict={"http":"http","websocket":"ws"}
	server_type=input("What's your server provider? [HTTP, WebSocket] (default=HTTP)").lower()
	server_type=server_type_dict[server_type] if server_type in server_type_dict else "http"
	server_address=input("What's your server address? [address:port] (default=localhost:8545)")
	if server_address=="":
		server_address="localhost:8545"
	config_dict={"provider":server_type,"address":server_address}
	config_text=json.dumps(config_dict,indent='\t')
	fn=open("config.json","w")
	fn.write(config_text)
	fn.close()