// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console2} from "forge-std/Test.sol";
import {Subscription} from "../src/Subscription.sol";

contract SubscriptionTest is Test {
    Subscription public subscription;
    
    address public owner;
    address public user1;
    address public user2;
    
    uint256 public constant SUBSCRIPTION_AMOUNT = 0.1 ether; // 0.1 PAS
    uint256 public constant BILLING_INTERVAL = 30 days;
    
    event Subscribed(address indexed user, uint256 amount);
    event Cancelled(address indexed user);
    event Billed(address indexed user, uint256 amount);
    
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        // Deploy subscription contract
        subscription = new Subscription(SUBSCRIPTION_AMOUNT, BILLING_INTERVAL);
        
        // Fund test users with native tokens
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }
    
    // Receive function to accept ETH
    receive() external payable {}
    
    function testConstructor() public {
        assertEq(subscription.owner(), owner);
        assertEq(subscription.subscriptionAmount(), SUBSCRIPTION_AMOUNT);
    }
    
    function testSubscribe() public {
        uint256 user1BalanceBefore = user1.balance;
        uint256 contractBalanceBefore = address(subscription).balance;
        
        // Test subscription
        vm.expectEmit(true, false, false, true);
        emit Subscribed(user1, SUBSCRIPTION_AMOUNT);
        
        vm.prank(user1);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT}();
        
        // Check subscription details
        (uint256 amount, uint256 lastBilled, bool active) = subscription.subscriptions(user1);
        assertEq(amount, SUBSCRIPTION_AMOUNT);
        assertEq(lastBilled, block.timestamp);
        assertTrue(active);
        
        // Check balances
        assertEq(user1.balance, user1BalanceBefore - SUBSCRIPTION_AMOUNT);
        assertEq(address(subscription).balance, contractBalanceBefore + SUBSCRIPTION_AMOUNT);
    }
    
    function testCannotSubscribeTwice() public {
        vm.prank(user1);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT}();
        
        vm.expectRevert("Already subscribed");
        vm.prank(user1);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT}();
    }
    
    function testCancel() public {
        // First subscribe
        vm.prank(user1);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT}();
        
        // Test cancellation
        vm.expectEmit(true, false, false, false);
        emit Cancelled(user1);
        
        vm.prank(user1);
        subscription.cancel();
        
        // Check subscription is inactive
        (,, bool active) = subscription.subscriptions(user1);
        assertFalse(active);
    }
    
    function testCannotCancelWhenNotSubscribed() public {
        vm.expectRevert("Not subscribed");
        vm.prank(user1);
        subscription.cancel();
    }
    
    function testBill() public {
        // Subscribe first
        vm.prank(user1);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT}();
        
        // Move time forward
        vm.warp(block.timestamp + 31 days);
        
        // Bill the user (just marks as billed, no automatic transfer)
        vm.expectEmit(true, false, false, true);
        emit Billed(user1, SUBSCRIPTION_AMOUNT);
        
        subscription.bill(user1);
        
        // Check lastBilled updated
        (,uint256 lastBilled,) = subscription.subscriptions(user1);
        assertEq(lastBilled, block.timestamp);
    }
    
    function testBillOnlyOwner() public {
        vm.prank(user1);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT}();
        
        vm.expectRevert("Not owner");
        vm.prank(user2);
        subscription.bill(user1);
    }
    
    function testBillInactiveSubscription() public {
        // Subscribe and cancel
        vm.prank(user1);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT}();
        
        vm.prank(user1);
        subscription.cancel();
        
        // Try to bill
        vm.expectRevert("Not active");
        subscription.bill(user1);
    }
    
    function testWithdraw() public {
        // Subscribe users to get funds in contract
        vm.prank(user1);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT}();
        
        vm.prank(user2);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT}();
        
        uint256 contractBalance = address(subscription).balance;
        uint256 ownerBalanceBefore = owner.balance;
        
        // Withdraw funds
        subscription.withdraw(contractBalance);
        
        assertEq(owner.balance, ownerBalanceBefore + contractBalance);
        assertEq(address(subscription).balance, 0);
    }
    
    function testWithdrawOnlyOwner() public {
        vm.expectRevert("Not owner");
        vm.prank(user1);
        subscription.withdraw(100);
    }
    
    function testMultipleUserScenario() public {
        // User1 subscribes
        vm.prank(user1);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT}();
        
        // User2 subscribes
        vm.prank(user2);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT}();
        
        // Move time forward
        vm.warp(block.timestamp + 31 days);
        
        // Bill user1
        subscription.bill(user1);
        
        // User2 cancels
        vm.prank(user2);
        subscription.cancel();
        
        // Try to bill cancelled user2
        vm.expectRevert("Not active");
        subscription.bill(user2);
        
        // User1 is still active
        (,, bool user1Active) = subscription.subscriptions(user1);
        assertTrue(user1Active);
    }
    
    function testIncorrectPaymentAmount() public {
        vm.expectRevert("Incorrect payment amount");
        vm.prank(user1);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT - 1}();
    }
    
    function testPaySubscription() public {
        // First subscribe
        vm.prank(user1);
        subscription.subscribe{value: SUBSCRIPTION_AMOUNT}();
        
        uint256 contractBalanceBefore = address(subscription).balance;
        
        // Move time forward
        vm.warp(block.timestamp + 31 days);
        
        // User pays subscription manually
        vm.expectEmit(true, false, false, true);
        emit Billed(user1, SUBSCRIPTION_AMOUNT);
        
        vm.prank(user1);
        subscription.paySubscription{value: SUBSCRIPTION_AMOUNT}();
        
        // Check contract balance increased
        assertEq(address(subscription).balance, contractBalanceBefore + SUBSCRIPTION_AMOUNT);
        
        // Check lastBilled updated
        (,uint256 lastBilled,) = subscription.subscriptions(user1);
        assertEq(lastBilled, block.timestamp);
    }
    
    function testPaySubscriptionNotSubscribed() public {
        vm.expectRevert("Not subscribed");
        vm.prank(user1);
        subscription.paySubscription{value: SUBSCRIPTION_AMOUNT}();
    }
    
    function testInsufficientBalanceForWithdraw() public {
        vm.expectRevert("Insufficient balance");
        subscription.withdraw(1 ether);
    }
}