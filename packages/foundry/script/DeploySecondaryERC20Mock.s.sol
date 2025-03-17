// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/SecondaryERC20Mock.sol";
import "./DeployHelpers.s.sol";

contract DeploySecondaryERC20Mock is ScaffoldETHDeploy {
    string name = "SecondaryERC20Mock";
    string symbol = "SECMERC";
    uint256 initialSupply = 1000000 * 10 ** 18;
    uint256 faucetAmount = 1000 * 10 ** 18;

    function run() external ScaffoldEthDeployerRunner {
        SecondaryERC20Mock secondaryErc20Mock = new SecondaryERC20Mock(
            name,
            symbol,
            initialSupply,
            faucetAmount
        );

        console.logString(
            string.concat(
                "SecondaryERC20Mock deployed at: ",
                vm.toString(address(secondaryErc20Mock))
            )
        );
    }
}
