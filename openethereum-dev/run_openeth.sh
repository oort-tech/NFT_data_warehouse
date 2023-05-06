#!/bin/bash

openethereum --chain ./private_chain.json --jsonrpc-apis=all --jsonrpc-cors=all --jsonrpc-hosts=all --tracing=on --pruning archive --base-path ~/openethereum
