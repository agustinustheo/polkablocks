// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title Subscription
 * @dev Simple subscription contract for recurring payments using ERC20 tokens
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
    
    // ERC20 token used for payments
    address public paymentToken;
    
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
     * @param _paymentToken Address of the ERC20 token for payments
     * @param _amount Fixed subscription amount in tokens
     * @param _interval Unused parameter (kept for compatibility)
     */
    constructor(address _paymentToken, uint256 _amount, uint256 _interval) {
        owner = msg.sender;
        paymentToken = _paymentToken;
        subscriptionAmount = _amount;
    }
    
    /**
     * @dev Allows users to start a subscription
     * - User must not have an active subscription
     * - Transfers initial payment from user to contract
     * - Sets subscription as active with current timestamp
     */
    function subscribe() external {
        // Check user doesn't already have active subscription
        require(!subscriptions[msg.sender].active, "Already subscribed");
        
        // Transfer subscription payment from user to this contract
        IERC20(paymentToken).transferFrom(msg.sender, address(this), subscriptionAmount);
        
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
     * @dev Allows owner to bill a user for their subscription
     * - Only owner can bill users
     * - User must have active subscription
     * - Transfers payment from user to contract
     * - Updates last billing timestamp
     */
    function bill(address user) external onlyOwner {
        UserSubscription storage sub = subscriptions[user];
        // Verify subscription is active
        require(sub.active, "Not active");
        
        // Transfer subscription payment from user to contract
        IERC20(paymentToken).transferFrom(user, address(this), sub.amount);
        
        // Update billing timestamp
        sub.lastBilled = block.timestamp;
        
        emit Billed(user, sub.amount);
    }
    
    /**
     * @dev Allows owner to withdraw collected funds
     * @param amount Number of tokens to withdraw
     */
    function withdraw(uint256 amount) external onlyOwner {
        IERC20(paymentToken).transferFrom(address(this), owner, amount);
    }
}