# GraphQL Server
This is written in Python for the hope of easier development.

## Get Started
We need the following dependencies:
- `flask`: This is our HTTP Server Framework
- `ariadne`: This is our GraphQL Operation Framework

Install them:
```
pip install flask ariadne
```

## Run Server
To start the server, first, setup the environment variables:
```bat
set FLASK_APP=server.py
set FLASK_DEBUG=1
```
If you use Linux:
```bash
export FLASK_APP=server.py
export FLASK_DEBUG=1
```
Then start the server:
```
flask run
```

To stop the server, press the magical `Ctrl+C`.

## Playground
We use Ariadne's GraphQL Playground. \
When your server is up, use browser to access the playground: http://localhost:5000/graphql

## Blockchain Network
A common blockchain network provider could be [Geth](https://geth.ethereum.org/downloads), [Ganache](https://trufflesuite.com/ganache/), or [OpenEthereum](https://github.com/openethereum/openethereum/releases). \
We use OpenEthereum to test blockchain network. Note that self-compiled version of OpenEthereum does not work. Use compiled version provided by GitHub repository instead.

### Configuration Generator
The `confgen.py` is an interactive script that generates a configuration file for the server to start.