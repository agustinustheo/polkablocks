// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console2} from "forge-std/Test.sol";
import {Subscription} from "../src/Subscription.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract SubscriptionTest is Test {
    Subscription public subscription;
    MockERC20 public token;
    
    address public owner;
    address public user1;
    address public user2;
    
    uint256 public constant SUBSCRIPTION_AMOUNT = 100 * 10**18; // 100 tokens
    uint256 public constant BILLING_INTERVAL = 30 days;
    
    event Subscribed(address indexed user, uint256 amount);
    event Cancelled(address indexed user);
    event Billed(address indexed user, uint256 amount);
    
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        // Deploy mock token
        token = new MockERC20();
        
        // Deploy subscription contract
        subscription = new Subscription(address(token), SUBSCRIPTION_AMOUNT, BILLING_INTERVAL);
        
        // Mint tokens to test users
        token.mint(user1, 1000 * 10**18);
        token.mint(user2, 1000 * 10**18);
        
        // Setup approvals
        vm.prank(user1);
        token.approve(address(subscription), type(uint256).max);
        
        vm.prank(user2);
        token.approve(address(subscription), type(uint256).max);
    }
    
    function testConstructor() public {
        assertEq(subscription.owner(), owner);
        assertEq(subscription.paymentToken(), address(token));
        assertEq(subscription.subscriptionAmount(), SUBSCRIPTION_AMOUNT);
    }
    
    function testSubscribe() public {
        uint256 user1BalanceBefore = token.balanceOf(user1);
        uint256 contractBalanceBefore = token.balanceOf(address(subscription));
        
        // Test subscription
        vm.expectEmit(true, false, false, true);
        emit Subscribed(user1, SUBSCRIPTION_AMOUNT);
        
        vm.prank(user1);
        subscription.subscribe();
        
        // Check subscription details
        (uint256 amount, uint256 lastBilled, bool active) = subscription.subscriptions(user1);
        assertEq(amount, SUBSCRIPTION_AMOUNT);
        assertEq(lastBilled, block.timestamp);
        assertTrue(active);
        
        // Check token balances
        assertEq(token.balanceOf(user1), user1BalanceBefore - SUBSCRIPTION_AMOUNT);
        assertEq(token.balanceOf(address(subscription)), contractBalanceBefore + SUBSCRIPTION_AMOUNT);
    }
    
    function testCannotSubscribeTwice() public {
        vm.prank(user1);
        subscription.subscribe();
        
        vm.expectRevert("Already subscribed");
        vm.prank(user1);
        subscription.subscribe();
    }
    
    function testCancel() public {
        // First subscribe
        vm.prank(user1);
        subscription.subscribe();
        
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
        subscription.subscribe();
        
        uint256 user1BalanceBefore = token.balanceOf(user1);
        uint256 contractBalanceBefore = token.balanceOf(address(subscription));
        
        // Move time forward
        vm.warp(block.timestamp + 31 days);
        
        // Bill the user
        vm.expectEmit(true, false, false, true);
        emit Billed(user1, SUBSCRIPTION_AMOUNT);
        
        subscription.bill(user1);
        
        // Check balances
        assertEq(token.balanceOf(user1), user1BalanceBefore - SUBSCRIPTION_AMOUNT);
        assertEq(token.balanceOf(address(subscription)), contractBalanceBefore + SUBSCRIPTION_AMOUNT);
        
        // Check lastBilled updated
        (,uint256 lastBilled,) = subscription.subscriptions(user1);
        assertEq(lastBilled, block.timestamp);
    }
    
    function testBillOnlyOwner() public {
        vm.prank(user1);
        subscription.subscribe();
        
        vm.expectRevert("Not owner");
        vm.prank(user2);
        subscription.bill(user1);
    }
    
    function testBillInactiveSubscription() public {
        // Subscribe and cancel
        vm.prank(user1);
        subscription.subscribe();
        
        vm.prank(user1);
        subscription.cancel();
        
        // Try to bill
        vm.expectRevert("Not active");
        subscription.bill(user1);
    }
    
    function testWithdraw() public {
        // Subscribe users to get funds in contract
        vm.prank(user1);
        subscription.subscribe();
        
        vm.prank(user2);
        subscription.subscribe();
        
        uint256 contractBalance = token.balanceOf(address(subscription));
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        
        // Approve subscription contract to transfer from itself
        vm.prank(address(subscription));
        token.approve(address(subscription), type(uint256).max);
        
        // Withdraw funds
        subscription.withdraw(contractBalance);
        
        assertEq(token.balanceOf(owner), ownerBalanceBefore + contractBalance);
        assertEq(token.balanceOf(address(subscription)), 0);
    }
    
    function testWithdrawOnlyOwner() public {
        vm.expectRevert("Not owner");
        vm.prank(user1);
        subscription.withdraw(100);
    }
    
    function testMultipleUserScenario() public {
        // User1 subscribes
        vm.prank(user1);
        subscription.subscribe();
        
        // User2 subscribes
        vm.prank(user2);
        subscription.subscribe();
        
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
    
    function testInsufficientBalance() public {
        // Create user with no tokens
        address poorUser = address(0x3);
        vm.prank(poorUser);
        token.approve(address(subscription), type(uint256).max);
        
        // Try to subscribe without tokens
        vm.expectRevert("Insufficient balance");
        vm.prank(poorUser);
        subscription.subscribe();
    }
    
    function testInsufficientAllowance() public {
        // Create user with tokens but no approval
        address noApprovalUser = address(0x4);
        token.mint(noApprovalUser, 1000 * 10**18);
        
        // Try to subscribe without approval
        vm.expectRevert("Insufficient allowance");
        vm.prank(noApprovalUser);
        subscription.subscribe();
    }
}