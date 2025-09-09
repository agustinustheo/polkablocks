#!/bin/bash

# Deploy Subscription Contract to Polkadot Asset Hub Testnet
# This script should be run from the .maintain directory

# Load environment variables
source .env

# Navigate to contracts directory
cd ../contracts

# Deploy the contract
forge script script/Deploy.s.sol:DeploySubscription \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    -vvvv