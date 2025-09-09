// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {Subscription} from "../src/Subscription.sol";

contract DeploySubscription is Script {
    function run() external returns (Subscription) {
        // Default deployment parameters
        uint256 subscriptionAmount = 0.1 ether; // 0.1 PAS
        uint256 interval = 30 days; // Monthly interval (unused in contract)
        
        // If SUBSCRIPTION_AMOUNT is set in environment, use it
        if (vm.envOr("SUBSCRIPTION_AMOUNT", uint256(0)) != 0) {
            subscriptionAmount = vm.envUint("SUBSCRIPTION_AMOUNT");
        }
        
        vm.startBroadcast();
        
        Subscription subscription = new Subscription(
            subscriptionAmount,
            interval
        );
        
        vm.stopBroadcast();
        
        return subscription;
    }
}