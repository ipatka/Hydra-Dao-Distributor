// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MaliciousToken is ERC20 {
    constructor() ERC20("Malicious", "MAL") {}
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        // Always return false to simulate a failed transfer
        return false;
    }
}