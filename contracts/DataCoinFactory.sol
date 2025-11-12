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

    address public usdcAddress;
    address public treasuryAddress;

    constructor(address _usdc, address _treasury) {
        usdcAddress = _usdc;
        treasuryAddress = _treasury;
    }

    function createDataCoin(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address creator_,
        string memory metadataCid_
    ) external returns (address, address) {
        DataCoin token = new DataCoin(name_, symbol_, totalSupply_, creator_, metadataCid_, msg.sender);
        BondingCurve curve = new BondingCurve(
            address(token),
            usdcAddress,
            creator_,
            treasuryAddress
        );

        emit DataCoinCreated(msg.sender, address(token), address(curve), symbol_, metadataCid_);
        return (address(token), address(curve));
    }
}
