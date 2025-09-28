module.exports = [
  {
    inputs: [
      {
        internalType: "address",
        name: "dataCoinImpl_",
        type: "address",
      },
      {
        internalType: "address",
        name: "uniswapV2Factory_",
        type: "address",
      },
      {
        internalType: "address",
        name: "uniswapV2Router_",
        type: "address",
      },
      {
        internalType: "address",
        name: "treasuryAddress_",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "dataCoinCreationFeeBps_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "liquidityLockDuration_",
        type: "uint256",
      },
      {
        internalType: "address[]",
        name: "assets_",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "minLockAmounts_",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "buyTaxBps_",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "sellTaxBps_",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "mintTaxBps_",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "lighthouseShareBps_",
        type: "uint256[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "EnforcedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "ExpectedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "FailedDeployment",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "InsufficientBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "InsufficientLockAmount",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAllocation",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidFeeConfig",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidTaxConfig",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidVestingDuration",
    type: "error",
  },
  {
    inputs: [],
    name: "LPTokensAlreadyWithdrawn",
    type: "error",
  },
  {
    inputs: [],
    name: "LPTokensStillLocked",
    type: "error",
  },
  {
    inputs: [],
    name: "LiquidityAdditionFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "LiquidityAlreadyAdded",
    type: "error",
  },
  {
    inputs: [],
    name: "NoLPTokensToWithdraw",
    type: "error",
  },
  {
    inputs: [],
    name: "NotCreator",
    type: "error",
  },
  {
    inputs: [],
    name: "OnlyDataCoin",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "SafeERC20FailedOperation",
    type: "error",
  },
  {
    inputs: [],
    name: "TokenAlreadyExists",
    type: "error",
  },
  {
    inputs: [],
    name: "TokenNotApproved",
    type: "error",
  },
  {
    inputs: [],
    name: "TokenNotFound",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroAddress",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "minLockAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "buyTaxBps",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "sellTaxBps",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "mintTaxBps",
        type: "uint256",
      },
    ],
    name: "AssetAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "coinAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "poolAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "symbol",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "tokenURI",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "lockToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokensLocked",
        type: "uint256",
      },
    ],
    name: "DataCoinCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "coinAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newCreator",
        type: "address",
      },
    ],
    name: "DataCoinCreatorUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "oldDataCoinImpl",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newDataCoinImpl",
        type: "address",
      },
    ],
    name: "DataCoinImplUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "coinAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "poolAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "lpTokenAmount",
        type: "uint256",
      },
    ],
    name: "LPTokensWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "coinAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "poolAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "houseAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "LiquidityAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "LockableTokenRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "minLockAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "buyTaxBps",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "sellTaxBps",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "mintTaxBps",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
    ],
    name: "LockableTokenUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "oldTreasuryFeeBps",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newTreasuryFeeBps",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "oldTreasuryAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newTreasuryAddress",
        type: "address",
      },
    ],
    name: "TreasuryConfigUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "oldFactory",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newFactory",
        type: "address",
      },
    ],
    name: "UniswapV2FactoryUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "oldRouter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newRouter",
        type: "address",
      },
    ],
    name: "UniswapV2RouterUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "BASIS_POINTS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_CONTRIBUTORS_ALLOCATION",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_CREATOR_ALLOCATION",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_CONTRIBUTORS_ALLOCATION",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_CREATOR_ALLOCATION",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_LIQUIDITY_ALLOCATION",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "minLockAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "buyTaxBps",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "sellTaxBps",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "mintTaxBps",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lighthouseShareBps",
        type: "uint256",
      },
    ],
    name: "addLockableToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "allDataCoins",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "approvedAssets",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "coinAddress",
        type: "address",
      },
    ],
    name: "canWithdrawLPTokens",
    outputs: [
      {
        internalType: "bool",
        name: "canWithdraw",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "timeRemaining",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol",
        type: "string",
      },
      {
        internalType: "string",
        name: "tokenURI",
        type: "string",
      },
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "creatorAllocationBps",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "creatorVestingDuration",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "contributorsAllocationBps",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "liquidityAllocationBps",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "lockToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "lockAmount",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
    ],
    name: "createDataCoin",
    outputs: [
      {
        internalType: "address",
        name: "coinAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "poolAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "dataCoinCreationFeeBPS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "dataCoinImpl",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "dataCoinInfo",
    outputs: [
      {
        internalType: "string",
        name: "tokenURI",
        type: "string",
      },
      {
        internalType: "address",
        name: "coinAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "poolAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        internalType: "address",
        name: "lockToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokensLocked",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "createdAt",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "liquidityAdded",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "lpTokenAmount",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "lpTokensWithdrawn",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "emergencyWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getApprovedLockTokens",
    outputs: [
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getDataCoinCount",
    outputs: [
      {
        internalType: "uint256",
        name: "count",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "offset",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "limit",
        type: "uint256",
      },
    ],
    name: "getDataCoins",
    outputs: [
      {
        internalType: "address[]",
        name: "coins",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
    ],
    name: "getDataCoinsByCreator",
    outputs: [
      {
        internalType: "address[]",
        name: "coins",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "getLockableTokenConfig",
    outputs: [
      {
        components: [
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "minLockAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "buyTaxBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "sellTaxBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "mintTaxBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "lighthouseShareBps",
            type: "uint256",
          },
        ],
        internalType: "struct DataCoinFactory.AssetConfig",
        name: "config",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "getMinLockAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "minAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "getTokenTaxRates",
    outputs: [
      {
        internalType: "uint256",
        name: "buyTax",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "sellTax",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "mintTax",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "isDataCoin",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "isTokenApproved",
    outputs: [
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidityLockDuration",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "lockableTokens",
    outputs: [
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "minLockAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "buyTaxBps",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "sellTaxBps",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "mintTaxBps",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lighthouseShareBps",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pauseCreation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "removeLockableToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "treasuryAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "uniswapV2Factory",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "uniswapV2Router",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "unpauseCreation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newDataCoinCreationFeeBPS",
        type: "uint256",
      },
    ],
    name: "updateDataCoinCreationFeeBPS",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newCreator",
        type: "address",
      },
      {
        internalType: "address",
        name: "coinAddress",
        type: "address",
      },
    ],
    name: "updateDataCoinCreator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newDataCoinImpl",
        type: "address",
      },
    ],
    name: "updateDataCoinImpl",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "minLockAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "buyTaxBps",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "sellTaxBps",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "mintTaxBps",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lighthouseShareBps",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
    ],
    name: "updateLockableToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newTreasuryAddress",
        type: "address",
      },
    ],
    name: "updateTreasuryAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newUniswapV2Factory",
        type: "address",
      },
    ],
    name: "updateUniswapV2Factory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newUniswapV2Router",
        type: "address",
      },
    ],
    name: "updateUniswapV2Router",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "coinAddress",
        type: "address",
      },
    ],
    name: "withdrawLPTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
