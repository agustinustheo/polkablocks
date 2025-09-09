// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {Subscription} from "../src/Subscription.sol";

contract DeploySubscription is Script {
    function run() external returns (Subscription) {
        // Default deployment parameters
        address paymentToken = address(0x1234567890123456789012345678901234567890); // Replace with actual token
        uint256 subscriptionAmount = 100 * 10**18; // 100 tokens (assuming 18 decimals)
        uint256 interval = 30 days; // Monthly interval (unused in contract)
        
        // If PAYMENT_TOKEN is set in environment, use it
        if (vm.envOr("PAYMENT_TOKEN", address(0)) != address(0)) {
            paymentToken = vm.envAddress("PAYMENT_TOKEN");
        }
        
        // If SUBSCRIPTION_AMOUNT is set in environment, use it
        if (vm.envOr("SUBSCRIPTION_AMOUNT", uint256(0)) != 0) {
            subscriptionAmount = vm.envUint("SUBSCRIPTION_AMOUNT");
        }
        
        vm.startBroadcast();
        
        Subscription subscription = new Subscription(
            paymentToken,
            subscriptionAmount,
            interval
        );
        
        vm.stopBroadcast();
        
        return subscription;
    }
}