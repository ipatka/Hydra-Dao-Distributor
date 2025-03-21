// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Hydra Dao Token Distributor
 * @notice A smart contract to split ERC20 tokens between multiple recipients.
 * @dev This is intended for research and development purposes only. Use this contract at your
 * own risk and discretion.
 */

contract TokenDistributor is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Events

    event Erc20Split(
        address indexed sender,
        address payable[] recipients,
        uint256[] amounts,
        IERC20 indexed token,
        address payable[] excludedAddresses,
        string excludedAddressesMessage
    );

    //*********************************************************************//
    // --------------------------- custom errors ------------------------- //
    //*********************************************************************//
    error INVALID_INPUT();
    error INVALID_RECIPIENT();
    error INSUFFICIENT_SPLIT_AMOUNT();
    error TRANSFER_FAILED();
    error DUPLICATE_RECIPIENT();

    /**
     * @notice The constructor initializes the Ownable contract
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice A function to check for duplicates in a sorted array of addresses
     * @dev Requires the array to be sorted in ascending order
     */
    function _checkForDuplicatesInSortedArray(address payable[] calldata recipients) internal pure {
        uint256 length = recipients.length;
        
        // For arrays with 0 or 1 elements, there can't be duplicates
        if (length <= 1) return;
        
        // Check that the array is sorted and has no duplicates
        for (uint256 i = 0; i < length - 1; i++) {
            // Check if current address is greater than or equal to the next one
            // If equal, it's a duplicate; if greater, the array isn't sorted
            if (recipients[i] >= recipients[i + 1]) {
                revert DUPLICATE_RECIPIENT();
            }
        }
    }

    /**
     * @notice Splits the ERC20 tokens amongst the given recipients, according to the specified amounts
     * @param token The token of friendship to be shared amongst the recipients
     * @param recipients The noble recipients of the ERC20 tokens (must be sorted in ascending order)
     * @param amounts The amounts each recipient shall receive
     */
    function splitERC20(
        IERC20 token,
        address payable[] calldata recipients,
        uint256[] calldata amounts,
        address payable[] calldata excludedAddresses,
        string calldata excludedAddressesMessage
    ) external nonReentrant {
        _checkForDuplicatesInSortedArray(recipients);
        _transferTokensFromSenderToRecipients(token, recipients, amounts);
        emit Erc20Split(
            msg.sender,
            recipients,
            amounts,
            token,
            excludedAddresses,
            excludedAddressesMessage
        );
    }

    /**
     * @notice Internal function to transfer ERC20 tokens from the sender to the recipients
     * @param erc20Token The ERC20 token to be shared
     * @param recipients The noble recipients of the tokens
     * @param amounts The amounts each recipient shall receive
     */
    function _transferTokensFromSenderToRecipients(
        IERC20 erc20Token,
        address payable[] calldata recipients,
        uint256[] calldata amounts
    ) internal {
        uint256 length = recipients.length;

        if (length != amounts.length) revert INVALID_INPUT();

        for (uint256 i = 0; i < length; ) {
            if (recipients[i] == address(0)) revert INVALID_RECIPIENT();
            if (amounts[i] == 0) revert INSUFFICIENT_SPLIT_AMOUNT();

            erc20Token.safeTransferFrom(
                msg.sender,
                recipients[i],
                amounts[i]
            );
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Withdraws the remaining ETH or ERC20 tokens to the owner's address
     * @param token The address of the ERC20 token, or 0 for ETH
     */
    function withdraw(IERC20 token) external onlyOwner {
        if (address(token) == address(0)) {
            (bool success, ) = owner().call{
                value: address(this).balance,
                gas: 20000
            }("");
            if (!success) revert TRANSFER_FAILED();
        } else {
            token.safeTransfer(owner(), token.balanceOf(address(this)));
        }
    }

    receive() external payable {}
}
