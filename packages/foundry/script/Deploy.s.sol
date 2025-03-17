//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import {DeployTokenDistributor} from "./DeployTokenDistributor.s.sol";
import {DeployERC20Mock} from "./DeployERC20Mock.s.sol";
import {DeploySecondaryERC20Mock} from "./DeploySecondaryERC20Mock.s.sol";

contract DeployScript is ScaffoldETHDeploy {
    function run() external {
        DeployERC20Mock deployERC20Mock = new DeployERC20Mock();
        deployERC20Mock.run();

        DeployTokenDistributor deployTokenDistributor = new DeployTokenDistributor();
        deployTokenDistributor.run();

        DeploySecondaryERC20Mock deploySecondaryERC20Mock = new DeploySecondaryERC20Mock();
        deploySecondaryERC20Mock.run();
    }
}
