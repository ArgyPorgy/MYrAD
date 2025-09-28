// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IDataCoinFactory {

    struct AssetConfig {
        bool isActive;                         // Whether token can be used for locking
        uint256 minLockAmount;                 // Minimum tokens required to lock
        uint256 buyTaxBps;                     // Buy tax for DataCoin (basis points)
        uint256 sellTaxBps;                    // Sell tax for DataCoin (basis points)
        uint256 mintTaxBps;                    // Mint tax for DataCoin (basis points)
        uint256 lighthouseShareBps;            // Lighthouse fee share in basis points
    }
    struct DataCoinInfo {
        address coinAddress;           // DataCoin contract address
        address poolAddress;           // Uniswap V2 pool address
        address creator;               // Creator address
        address lockToken;             // Token that was locked
        uint256 tokensLocked;          // Amount of tokens locked
        uint256 createdAt;             // Creation timestamp
        bool liquidityAdded;           // Whether initial liquidity was added
        uint256 lpTokenAmount;         // Amount of LP tokens locked
        bool lpTokensWithdrawn;        // Whether LP tokens have been withdrawn
    }

    // ============ MAIN FUNCTIONS ============
    function createDataCoin(string memory name, string memory symbol, string memory tokenURI, address creator, uint256 creatorAllocationBps, uint256 creatorVestingDuration, uint256 contributorsAllocationBps, uint256 liquidityAllocationBps, address lockToken, uint256 lockAmount, bytes32 salt) external returns (address coinAddress, address poolAddress);

    function updateDataCoinCreator(address newCreator, address coinAddress) external;

    // ============ VIEW FUNCTIONS ============

    function canWithdrawLPTokens(address coinAddress) external view returns (bool canWithdraw, uint256 timeRemaining);

    function dataCoinCreationFeeBPS() external view returns (uint256);

    function dataCoinInfo(address coinAddress) external view returns (DataCoinInfo memory);

    function getApprovedLockTokens() external view returns (address[] memory);

    function getLockableTokenConfig(address token) external view returns (AssetConfig memory);

    function getMinLockAmount(address token) external view returns (uint256);
}