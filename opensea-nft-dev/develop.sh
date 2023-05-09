#!/bin/bash

# run migration
truffle migrate --network $1;

# run console
truffle console --network $1;
