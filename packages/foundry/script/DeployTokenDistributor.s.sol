//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/TokenDistributor.sol";
import "./DeployHelpers.s.sol";

contract DeployYourContract is ScaffoldETHDeploy {
    // use `deployer` from `ScaffoldETHDeploy`
    function run() external ScaffoldEthDeployerRunner {
        TokenDistributor tokenDistributor = new TokenDistributor();
        console.logString(
            string.concat(
                "TokenDistributor deployed at: ",
                vm.toString(address(tokenDistributor))
            )
        );
    }
}
