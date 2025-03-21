// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "forge-std/Test.sol";
import "../contracts/TokenDistributor.sol";
import "../contracts/ERC20Mock.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenDistributorTest is Test {
    TokenDistributor public distributor;
    ERC20Mock public token;
    
    address public owner;
    address public user1;
    address public user2;
    address public user3;
    address public newOwner;
    
    uint256 public initialSupply = 1_000_000 * 10**18;
    uint256 public faucetAmount = 1000 * 10**18;
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        newOwner = makeAddr("newOwner");
        
        // Deploy contracts
        distributor = new TokenDistributor();
        token = new ERC20Mock("Test Token", "TEST", initialSupply, faucetAmount);
        
        // Fund test accounts
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);
        vm.deal(newOwner, 10 ether);
        
        // Transfer some tokens to user1 for testing
        token.transfer(user1, 100_000 * 10**18);
    }
    
    // Test basic token distribution functionality
    function testSplitERC20() public {
        // Setup recipients and amounts
        address payable[] memory recipients = new address payable[](2);
        recipients[0] = payable(user2);
        recipients[1] = payable(user3);
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 * 10**18;
        amounts[1] = 2000 * 10**18;
        
        address payable[] memory excludedAddresses = new address payable[](0);
        
        // Approve tokens for distributor
        vm.startPrank(user1);
        token.approve(address(distributor), 3000 * 10**18);
        
        // Distribute tokens
        distributor.splitERC20(
            IERC20(address(token)),
            recipients,
            amounts,
            excludedAddresses,
            "No excluded addresses"
        );
        vm.stopPrank();
        
        // Verify balances
        assertEq(token.balanceOf(user2), 1000 * 10**18);
        assertEq(token.balanceOf(user3), 2000 * 10**18);
    }
    
    // Test with excluded addresses
    function testSplitERC20WithExcludedAddresses() public {
        // Setup recipients and amounts
        address payable[] memory recipients = new address payable[](2);
        recipients[0] = payable(user2);
        recipients[1] = payable(user3);
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 * 10**18;
        amounts[1] = 2000 * 10**18;
        
        address payable[] memory excludedAddresses = new address payable[](1);
        excludedAddresses[0] = payable(makeAddr("excluded"));
        
        // Approve tokens for distributor
        vm.startPrank(user1);
        token.approve(address(distributor), 3000 * 10**18);
        
        // Distribute tokens
        distributor.splitERC20(
            IERC20(address(token)),
            recipients,
            amounts,
            excludedAddresses,
            "These addresses were excluded"
        );
        vm.stopPrank();
        
        // Verify balances
        assertEq(token.balanceOf(user2), 1000 * 10**18);
        assertEq(token.balanceOf(user3), 2000 * 10**18);
    }
    
    // Test for duplicate recipients
    function testRevertOnDuplicateRecipients() public {
        // Setup recipients with duplicates
        address payable[] memory recipients = new address payable[](3);
        recipients[0] = payable(user2);
        recipients[1] = payable(user3);
        recipients[2] = payable(user2); // Duplicate
        
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 1000 * 10**18;
        amounts[1] = 2000 * 10**18;
        amounts[2] = 500 * 10**18;
        
        address payable[] memory excludedAddresses = new address payable[](0);
        
        // Approve tokens for distributor
        vm.startPrank(user1);
        token.approve(address(distributor), 3500 * 10**18);
        
        // Expect revert on duplicate recipients
        vm.expectRevert(TokenDistributor.DUPLICATE_RECIPIENT.selector);
        distributor.splitERC20(
            IERC20(address(token)),
            recipients,
            amounts,
            excludedAddresses,
            ""
        );
        vm.stopPrank();
    }
    
    // Test for invalid input (mismatched arrays)
    function testRevertOnMismatchedArrays() public {
        // Setup recipients and amounts with different lengths
        address payable[] memory recipients = new address payable[](2);
        recipients[0] = payable(user2);
        recipients[1] = payable(user3);
        
        uint256[] memory amounts = new uint256[](3); // Different length
        amounts[0] = 1000 * 10**18;
        amounts[1] = 2000 * 10**18;
        amounts[2] = 500 * 10**18;
        
        address payable[] memory excludedAddresses = new address payable[](0);
        
        // Approve tokens for distributor
        vm.startPrank(user1);
        token.approve(address(distributor), 3500 * 10**18);
        
        // Expect revert on mismatched arrays
        vm.expectRevert(TokenDistributor.INVALID_INPUT.selector);
        distributor.splitERC20(
            IERC20(address(token)),
            recipients,
            amounts,
            excludedAddresses,
            ""
        );
        vm.stopPrank();
    }
    
    // Test for zero address recipient
    function testRevertOnZeroAddressRecipient() public {
        // Setup recipients with zero address
        address payable[] memory recipients = new address payable[](2);
        recipients[0] = payable(user2);
        recipients[1] = payable(address(0)); // Zero address
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 * 10**18;
        amounts[1] = 2000 * 10**18;
        
        address payable[] memory excludedAddresses = new address payable[](0);
        
        // Approve tokens for distributor
        vm.startPrank(user1);
        token.approve(address(distributor), 3000 * 10**18);
        
        // Expect revert on zero address recipient
        vm.expectRevert(TokenDistributor.INVALID_RECIPIENT.selector);
        distributor.splitERC20(
            IERC20(address(token)),
            recipients,
            amounts,
            excludedAddresses,
            ""
        );
        vm.stopPrank();
    }
    
    // Test for zero amount
    function testRevertOnZeroAmount() public {
        // Setup recipients with zero amount
        address payable[] memory recipients = new address payable[](2);
        recipients[0] = payable(user2);
        recipients[1] = payable(user3);
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 * 10**18;
        amounts[1] = 0; // Zero amount
        
        address payable[] memory excludedAddresses = new address payable[](0);
        
        // Approve tokens for distributor
        vm.startPrank(user1);
        token.approve(address(distributor), 1000 * 10**18);
        
        // Expect revert on zero amount
        vm.expectRevert(TokenDistributor.INSUFFICIENT_SPLIT_AMOUNT.selector);
        distributor.splitERC20(
            IERC20(address(token)),
            recipients,
            amounts,
            excludedAddresses,
            ""
        );
        vm.stopPrank();
    }
    
    // Test for insufficient allowance
    function testRevertOnInsufficientAllowance() public {
        // Setup recipients and amounts
        address payable[] memory recipients = new address payable[](2);
        recipients[0] = payable(user2);
        recipients[1] = payable(user3);
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 * 10**18;
        amounts[1] = 2000 * 10**18;
        
        address payable[] memory excludedAddresses = new address payable[](0);
        
        // Approve less tokens than needed
        vm.startPrank(user1);
        token.approve(address(distributor), 2000 * 10**18); // Not enough for 3000
        
        // Expect revert on insufficient allowance
        vm.expectRevert();
        distributor.splitERC20(
            IERC20(address(token)),
            recipients,
            amounts,
            excludedAddresses,
            ""
        );
        vm.stopPrank();
    }
    
    // Test withdraw functionality (ERC20)
    function testWithdrawERC20() public {
        // Send some tokens to the distributor contract
        token.transfer(address(distributor), 5000 * 10**18);
        
        // Check initial balances
        uint256 initialOwnerBalance = token.balanceOf(owner);
        uint256 initialDistributorBalance = token.balanceOf(address(distributor));
        
        // Withdraw tokens
        distributor.withdraw(IERC20(address(token)));
        
        // Verify balances after withdrawal
        assertEq(token.balanceOf(owner), initialOwnerBalance + initialDistributorBalance);
        assertEq(token.balanceOf(address(distributor)), 0);
    }
    
    // Test withdraw functionality (ETH)
    function testWithdrawETH() public {
        // Send some ETH to the distributor contract
        (bool sent, ) = address(distributor).call{value: 1 ether}("");
        require(sent, "Failed to send ETH");
        
        // Check initial balances
        uint256 initialOwnerBalance = address(owner).balance;
        uint256 initialDistributorBalance = address(distributor).balance;
        
        // Withdraw ETH
        distributor.withdraw(IERC20(address(0)));
        
        // Verify balances after withdrawal
        assertEq(address(owner).balance, initialOwnerBalance + initialDistributorBalance);
        assertEq(address(distributor).balance, 0);
    }
    
    // Test onlyOwner modifier
    function testRevertOnNonOwnerWithdraw() public {
        // Send some tokens to the distributor contract
        token.transfer(address(distributor), 5000 * 10**18);
        
        // Try to withdraw as non-owner
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user1));
        distributor.withdraw(IERC20(address(token)));
    }
    
    // Test ownership transfer
    function testTransferOwnership() public {
        // Verify initial owner
        assertEq(distributor.owner(), owner);
        
        // Transfer ownership
        distributor.transferOwnership(newOwner);
        
        // Verify new owner is set immediately
        assertEq(distributor.owner(), newOwner);
        
        // Old owner can no longer withdraw
        token.transfer(address(distributor), 1000 * 10**18);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, owner));
        distributor.withdraw(IERC20(address(token)));
        
        // New owner can withdraw
        vm.prank(newOwner);
        distributor.withdraw(IERC20(address(token)));
        
        // Verify tokens were sent to new owner
        assertEq(token.balanceOf(newOwner), 1000 * 10**18);
    }
    
    // Test renounce ownership
    function testRenounceOwnership() public {
        // Verify initial owner
        assertEq(distributor.owner(), owner);
        
        // Renounce ownership
        distributor.renounceOwnership();
        
        // Verify owner is now zero address
        assertEq(distributor.owner(), address(0));
        
        // Previous owner can no longer withdraw
        token.transfer(address(distributor), 1000 * 10**18);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, owner));
        distributor.withdraw(IERC20(address(token)));
    }
    
    // Test event emission
    function testEventEmission() public {
        // Setup recipients and amounts
        address payable[] memory recipients = new address payable[](2);
        recipients[0] = payable(user2);
        recipients[1] = payable(user3);
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 * 10**18;
        amounts[1] = 2000 * 10**18;
        
        address payable[] memory excludedAddresses = new address payable[](1);
        excludedAddresses[0] = payable(makeAddr("excluded"));
        string memory message = "Test message";
        
        // Approve tokens for distributor
        vm.startPrank(user1);
        token.approve(address(distributor), 3000 * 10**18);
        
        // Expect event emission
        vm.expectEmit(true, true, false, true);
        emit TokenDistributor.Erc20Split(
            user1,
            recipients,
            amounts,
            IERC20(address(token)),
            excludedAddresses,
            message
        );
        
        // Distribute tokens
        distributor.splitERC20(
            IERC20(address(token)),
            recipients,
            amounts,
            excludedAddresses,
            message
        );
        vm.stopPrank();
    }
    
    // Test with large number of recipients
    function testLargeNumberOfRecipients() public {
        uint256 recipientCount = 50; // Adjust based on gas limits
        
        // Setup recipients and amounts
        address payable[] memory recipients = new address payable[](recipientCount);
        uint256[] memory amounts = new uint256[](recipientCount);
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipientCount; i++) {
            recipients[i] = payable(makeAddr(string(abi.encodePacked("recipient", vm.toString(i)))));
            amounts[i] = 100 * 10**18;
            totalAmount += amounts[i];
        }
        
        address payable[] memory excludedAddresses = new address payable[](0);
        
        // Transfer enough tokens to user1
        token.transfer(user1, totalAmount);
        
        // Approve tokens for distributor
        vm.startPrank(user1);
        token.approve(address(distributor), totalAmount);
        
        // Distribute tokens
        distributor.splitERC20(
            IERC20(address(token)),
            recipients,
            amounts,
            excludedAddresses,
            ""
        );
        vm.stopPrank();
        
        // Verify a few random balances
        assertEq(token.balanceOf(recipients[0]), 100 * 10**18);
        assertEq(token.balanceOf(recipients[recipientCount - 1]), 100 * 10**18);
        assertEq(token.balanceOf(recipients[recipientCount / 2]), 100 * 10**18);
    }
    
    // Test with a malicious token that returns false on transfer
    function testMaliciousToken() public {
        // This would require a custom malicious token implementation
        // For now, we'll skip this test as it requires additional setup
    }
    
    // Receive function to handle ETH transfers
    receive() external payable {}
}
