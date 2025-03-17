// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/ERC20Mock.sol";
import "./DeployHelpers.s.sol";

contract DeployERC20Mock is ScaffoldETHDeploy {
    string name = "ERC20Mock";
    string symbol = "MERC";
    uint256 initialSupply = 1000000 * 10 ** 18;
    uint256 faucetAmount = 1000 * 10 ** 18;

    uint256 maxTransferAmount = 500 * 10 ** 18;
    uint256 walletCount = 20;

    function run() external ScaffoldEthDeployerRunner {
        ERC20Mock erc20Mock = new ERC20Mock(
            name,
            symbol,
            initialSupply,
            faucetAmount
        );

        console.logString(
            string.concat(
                "ERC20Mock deployed at: ",
                vm.toString(address(erc20Mock))
            )
        );

        for (uint256 i = 0; i < walletCount; i++) {
            address newWallet = vm.addr(
                uint256(keccak256(abi.encodePacked(i)))
            );

            uint256 randomAmount = _getRandomAmount(i);
            erc20Mock.transfer(newWallet, randomAmount);

            console.logString(
                string.concat(
                    "Transferred ",
                    vm.toString(randomAmount),
                    " tokens to wallet: ",
                    vm.toString(newWallet)
                )
            );
        }
    }

    function _getRandomAmount(uint256 seed) private view returns (uint256) {
        return
            uint256(keccak256(abi.encodePacked(block.timestamp, seed))) %
            maxTransferAmount;
    }
}
