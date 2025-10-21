// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./DataCoin.sol";
import "./BondingCurve.sol";

contract DataCoinFactory {
    event DataCoinCreated(
        address indexed creator,
        address indexed dataCoinAddress,
        address indexed bondingCurveAddress,
        string symbol,
        string cid
    );

    address public platformAddress;

    constructor(address _platform) {
        platformAddress = _platform;
    }

    function createDataCoin(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        uint256,
        string memory metadataCid_
    ) external returns (address, address) {
        DataCoin token = new DataCoin(name_, symbol_, totalSupply_, msg.sender, metadataCid_);
        BondingCurve curve = new BondingCurve(address(token), msg.sender, platformAddress);

        emit DataCoinCreated(msg.sender, address(token), address(curve), symbol_, metadataCid_);
        return (address(token), address(curve));
    }
}
