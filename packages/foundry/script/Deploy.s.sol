//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import {DeployTokenDistributor} from "./DeployTokenDistributor.s.sol";
import {DeployMockERC20} from "./DeployMockERC20.s.sol";

contract DeployScript is ScaffoldETHDeploy {
    function run() external {
        DeployMockERC20 deployMockERC20 = new DeployMockERC20();
        deployMockERC20.run();

        DeployTokenDistributor deployTokenDistributor = new DeployTokenDistributor();
        deployTokenDistributor.run();
    }
}
