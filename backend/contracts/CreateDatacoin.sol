// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.23;

import {IDataCoin} from "./interfaces/IDataCoin.sol";
import {IDataCoinFactory} from "./interfaces/IDataCoinFactory.sol";
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';


contract CreateDatacoin {
    IDataCoinFactory public dataCoinFactory;
    IDataCoin public dataCoin;
    address public pool;


    constructor(address _dataCoinFactory) {
        dataCoinFactory = IDataCoinFactory(_dataCoinFactory);
    }

    function getApprovedLockTokenAndConfig() public view returns (address[] memory, IDataCoinFactory.AssetConfig[] memory) {
        address[] memory tokens = dataCoinFactory.getApprovedLockTokens();
        IDataCoinFactory.AssetConfig[] memory configs = new IDataCoinFactory.AssetConfig[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            configs[i] = dataCoinFactory.getLockableTokenConfig(tokens[i]);
        }
        return (tokens, configs);
    }

    // Make sure to approve lockToken to this contract address to create datacoin successfully
    function createDataCoin() public {
        string memory name = "Amazing Datacoin";
        string memory symbol = "ADC";
        string memory tokenURI = "https://example.com/data-coin.png";
        address creator = msg.sender;
        uint256 creatorAllocationBps = 1000; // 10%
        uint256 creatorVestingDuration = 365 days;
        uint256 contributorsAllocationBps = 6000; // 60%
        uint256 liquidityAllocationBps = 3000; // 30%
        address lockToken = 0x2EA104BCdF3A448409F2dc626e606FdCf969a5aE; // LSDC on sepolia
        uint256 lockAmount = dataCoinFactory.getMinLockAmount(lockToken);
        bytes32 salt = keccak256(abi.encodePacked(block.timestamp, msg.sender));

        // transfering lock token from caller to this contract address, requires approval
        IERC20(lockToken).transferFrom(msg.sender, address(this), lockAmount);
        IERC20(lockToken).approve(address(dataCoinFactory), lockAmount);

        (address coinAddress, address poolAddress) = dataCoinFactory.createDataCoin(
            name,
            symbol,
            tokenURI,
            creator, // admin of datacoin 
            creatorAllocationBps,
            creatorVestingDuration,
            contributorsAllocationBps,
            liquidityAllocationBps,
            lockToken,
            lockAmount,
            salt
        );
        dataCoin = IDataCoin(coinAddress);
        pool = poolAddress;
    }

    // minter role should be granted to this contract to mint tokens
    function mintDataCoin(address to, uint256 amount) public {
        dataCoin.mint(to, amount);
    }



}