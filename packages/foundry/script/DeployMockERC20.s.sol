//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/MockERC20.sol";
import "./DeployHelpers.s.sol";

contract DeployMockERC20 is ScaffoldETHDeploy {
    // use `deployer` from `ScaffoldETHDeploy`

    const name = "MockERC20";
    const symbol = "MERC";
    const initialSupply = 1000000;
    const faucetAmount = 1000;

    function run() external ScaffoldEthDeployerRunner {
        ERC20Mock erc20Mock = new ERC20Mock(
            name,
            symbol,
            initialSupply,
            faucetAmount
        );
        console.logString(
            string.concat(
                "MockERC20 deployed at: ",
                vm.toString(address(erc20Mock))
            )
        );
    }
}
