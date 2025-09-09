// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Subscription
 * @dev Simple subscription contract for recurring payments using native tokens (ETH/PAS)
 */
contract Subscription {
    // Stores information about each user's subscription
    struct UserSubscription {
        uint256 amount;         // Subscription amount in tokens
        uint256 lastBilled;     // Timestamp of last billing
        bool active;            // Whether subscription is active
    }
    
    // Contract owner who can bill users and withdraw funds
    address public owner;
    
    // Fixed subscription amount for all users
    uint256 public subscriptionAmount;
    
    // Maps user addresses to their subscription details
    mapping(address => UserSubscription) public subscriptions;
    
    // Events for tracking subscription activities
    event Subscribed(address indexed user, uint256 amount);
    event Cancelled(address indexed user);
    event Billed(address indexed user, uint256 amount);
    
    // Restricts function access to contract owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    /**
     * @dev Initializes the subscription contract
     * @param _amount Fixed subscription amount in wei
     * @param _interval Unused parameter (kept for compatibility)
     */
    constructor(uint256 _amount, uint256 _interval) {
        owner = msg.sender;
        subscriptionAmount = _amount;
    }
    
    /**
     * @dev Allows users to start a subscription
     * - User must not have an active subscription
     * - User must send exact subscription amount
     * - Sets subscription as active with current timestamp
     */
    function subscribe() external payable {
        // Check user doesn't already have active subscription
        require(!subscriptions[msg.sender].active, "Already subscribed");
        
        // Check correct payment amount
        require(msg.value == subscriptionAmount, "Incorrect payment amount");
        
        // Create new subscription record
        subscriptions[msg.sender] = UserSubscription({
            amount: subscriptionAmount,
            lastBilled: block.timestamp,
            active: true
        });
        
        emit Subscribed(msg.sender, subscriptionAmount);
    }
    
    /**
     * @dev Allows users to cancel their subscription
     * - User must have an active subscription
     * - Simply marks subscription as inactive
     */
    function cancel() external {
        // Check user has active subscription
        require(subscriptions[msg.sender].active, "Not subscribed");
        
        // Mark subscription as inactive
        subscriptions[msg.sender].active = false;
        
        emit Cancelled(msg.sender);
    }
    
    /**
     * @dev Allows owner to mark a user as billed
     * - Only owner can mark users as billed
     * - User must have active subscription
     * - Note: With native tokens, users must manually send payments
     * - Updates last billing timestamp
     */
    function bill(address user) external onlyOwner {
        UserSubscription storage sub = subscriptions[user];
        // Verify subscription is active
        require(sub.active, "Not active");
        
        // Update billing timestamp
        sub.lastBilled = block.timestamp;
        
        emit Billed(user, sub.amount);
    }
    
    /**
     * @dev Allows owner to withdraw collected funds
     * @param amount Amount of wei to withdraw
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(owner).transfer(amount);
    }
    
    /**
     * @dev Allows users to pay their subscription manually
     */
    function paySubscription() external payable {
        UserSubscription storage sub = subscriptions[msg.sender];
        require(sub.active, "Not subscribed");
        require(msg.value == sub.amount, "Incorrect payment amount");
        
        // Payment received, update last billed
        sub.lastBilled = block.timestamp;
        
        emit Billed(msg.sender, sub.amount);
    }
}