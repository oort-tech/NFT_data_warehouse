#!/bin/bash

# run migration
truffle migrate --network $1;

# fix metadata
./fix_build_json_empty_metadata.sh;

# run console
truffle console --network $1;
