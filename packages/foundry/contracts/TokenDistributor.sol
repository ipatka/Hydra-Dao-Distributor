// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Hydra Dao Token Distributor
 * @notice A smart contract to split ERC20 tokens between multiple recipients.
 * @dev This is intended for research and development purposes only. Use this contract at your
 * own risk and discretion.
 */

contract TokenDistributor is ReentrancyGuard {
    using SafeERC20 for IERC20;
    address immutable _owner;

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
    error ONLY_OWNER();
    error TRANSFER_FAILED();
    error DUPLICATE_RECIPIENT();

    /**
     * @notice The constructor sets the owner of the contract
     */
    constructor() {
        _owner = msg.sender;
    }

    /**
     * @notice A modifier to ensure that only the owner can perform certain actions
     */
    modifier onlyOwner() {
        if (msg.sender != _owner) revert ONLY_OWNER();
        _;
    }

    /**
     * @notice A modifier to check for duplicates and revert before execute a function
     */

    modifier checkForDuplicates(address payable[] calldata recipients) {
        uint256 length = recipients.length;
        for (uint256 i = 0; i < length; i++) {
            for (uint256 j = i + 1; j < length; j++) {
                if (recipients[i] == recipients[j]) {
                    revert DUPLICATE_RECIPIENT();
                }
            }
        }
        _;
    }

    /**
     * @notice Splits the ERC20 tokens amongst the given recipients, according to the specified amounts
     * @param token The token of friendship to be shared amongst the recipients
     * @param recipients The noble recipients of the ERC20 tokens
     * @param amounts The amounts each recipient shall receive
     */
    function splitERC20(
        IERC20 token,
        address payable[] calldata recipients,
        uint256[] calldata amounts,
        address payable[] calldata excludedAddresses,
        string calldata excludedAddressesMessage
    ) external nonReentrant checkForDuplicates(recipients) {
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

            SafeERC20.safeTransferFrom(
                erc20Token,
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
            (bool success, ) = _owner.call{
                value: address(this).balance,
                gas: 20000
            }("");
            if (!success) revert TRANSFER_FAILED();
        } else {
            token.transfer(_owner, token.balanceOf(address(this)));
        }
    }

    receive() external payable {}
}
