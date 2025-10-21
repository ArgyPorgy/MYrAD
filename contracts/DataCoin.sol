// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DataCoin is ERC20 {
    address public creator;
    string public datasetCid;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address creator_,
        string memory cid_
    ) ERC20(name_, symbol_) {
        creator = creator_;
        datasetCid = cid_;
        // Mint all tokens to creator
        if (totalSupply_ > 0) {
            _mint(creator_, totalSupply_);
        }
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnForAccess() external {
        _burn(msg.sender, balanceOf(msg.sender));
    }
}
