#!/bin/bash

# Deploy Subscription Contract to Polkadot Asset Hub Testnet

# Load environment variables
source .env

# Deploy the contract
forge script script/Deploy.s.sol:DeploySubscription \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    -vvvv