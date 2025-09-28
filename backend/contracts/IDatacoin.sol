// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IDataCoin {
    struct VestingConfig {
        uint256 totalAmount;        // Total amount to vest
        uint256 startTime;          // Vesting start timestamp
        uint256 duration;           // Vesting duration in seconds
        uint256 claimed;            // Amount already claimed
        address recipient;          // Vesting recipient
    }
    struct AllocationConfig {
        uint256 creatorAllocBps;
        uint256 creatorVestingDuration;
        uint256 contributorsAllocBps;
        uint256 liquidityAllocBps;
    }
    struct TaxConfig {
        uint256 buyTaxBps;
        uint256 sellTaxBps;
        uint256 mintTaxBps;
        uint256 lighthouseShareBps;
    }

    function approve(address spender, uint256 amount) external returns (bool);

    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    function claimVesting() external returns (uint256);


    // ============ MINTER ROLE FUNCTIONS ============
    function mint(address to, uint256 amount) external;

    // ============ ADMIN FUNCTIONS ============

    function updateCreator(address newCreator) external;

    function pauseMinting() external;

    function unpauseMinting() external;

    function grantRole(bytes32 role, address account) external;

    function revokeRole(bytes32 role, address account) external;

    function renounceRole(bytes32 role, address account) external;


    // ============ FACTORY ROLE FUNCTIONS ============
    function markInitialLiquidityAdded() external;



    // ============ VIEW FUNCTIONS ============

    function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

    function MINTER_ROLE() external view returns (bytes32);

    function MAX_SUPPLY() external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function creator() external view returns (address);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function tokenURI() external view returns (string memory);

    function getClaimableAmount() external view returns (uint256);

    function getVestingInfo() external view returns (VestingConfig memory);

    function poolAddress() external view returns (address);

    function getRemainingContributorsalloc() external view returns (uint256);

    function getLiquidityAlloc() external view returns (uint256);

    function confirmFactory() external;
}