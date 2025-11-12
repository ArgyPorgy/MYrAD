// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IERC20 {
    function decimals() external view returns (uint8);
    function balanceOf(address) external view returns (uint256);
    function transfer(address to, uint256 amt) external returns (bool);
    function transferFrom(address from, address to, uint256 amt) external returns (bool);
    function approve(address spender, uint256 amt) external returns (bool);
}

interface IDataCoin {
    function burn(uint256 amount) external;
}

contract DataTokenMarketplace {
    struct Pool {
        address token;        // DataToken address
        address creator;      // data owner (revenue receiver)
        uint256 rToken;       // token reserve (raw units)
        uint256 rUSDC;        // USDC reserve (6 decimals)
        bool exists;
    }

    IERC20 public immutable usdc;
    address public immutable treasury;
    uint256 public constant FEE_BPS = 500; // 5% fee on BUY
    uint256 public constant BPS = 10_000;

    mapping(address => Pool) public pools;

    uint256 public constant MIN_BURN_VALUE_USDC = 5e5; // 0.5 USDC with 6 decimals

    event PoolCreated(address indexed token, address indexed creator, uint256 tokenSeed, uint256 usdcSeed);
    event Bought(address indexed token, address indexed buyer, uint256 usdcIn, uint256 fee, uint256 tokensOut);
    event Sold(address indexed token, address indexed seller, uint256 tokensIn, uint256 usdcOut);
    event TokensBurned(address indexed token, address indexed burner, uint256 amountBurned, uint256 newPrice);
    event AccessGranted(address indexed token, address indexed buyer);

    constructor(address _usdc, address _treasury) {
        usdc = IERC20(_usdc);
        treasury = _treasury;
    }

    function initPool(
        address token,
        address creator,
        uint256 tokenSeed,
        uint256 usdcSeed
    ) external {
        require(!pools[token].exists, "Pool exists");
        require(token != address(0) && creator != address(0), "bad addr");
        require(tokenSeed > 0 && usdcSeed > 0, "zero seed");

        require(IERC20(token).transferFrom(msg.sender, address(this), tokenSeed), "pull token");
        require(usdc.transferFrom(msg.sender, address(this), usdcSeed), "pull usdc");

        pools[token] = Pool({
            token: token,
            creator: creator,
            rToken: tokenSeed,
            rUSDC: usdcSeed,
            exists: true
        });

        emit PoolCreated(token, creator, tokenSeed, usdcSeed);
    }

    function buy(address token, uint256 usdcIn, uint256 minTokensOut) external {
        Pool storage p = pools[token];
        require(p.exists, "no pool");
        require(usdcIn > 0, "zero in");

        require(usdc.transferFrom(msg.sender, address(this), usdcIn), "pull usdc");

        uint256 fee = (usdcIn * FEE_BPS) / BPS;
        uint256 usdcToPool = usdcIn - fee;

        uint256 toCreator = (fee * 8000) / BPS;
        uint256 toTreasury = fee - toCreator;
        require(usdc.transfer(p.creator, toCreator), "fee creator");
        require(usdc.transfer(treasury, toTreasury), "fee treas");

        uint256 k = p.rToken * p.rUSDC;
        uint256 newRUSDC = p.rUSDC + usdcToPool;
        uint256 newRToken = k / newRUSDC;
        uint256 tokensOut = p.rToken - newRToken;

        require(tokensOut >= minTokensOut && tokensOut > 0, "slippage");

        p.rUSDC = newRUSDC;
        p.rToken = newRToken;

        require(IERC20(token).transfer(msg.sender, tokensOut), "send token");

        emit Bought(token, msg.sender, usdcIn, fee, tokensOut);
        emit AccessGranted(token, msg.sender);
    }

    function sell(address token, uint256 tokenIn, uint256 minUsdcOut) external {
        Pool storage p = pools[token];
        require(p.exists, "no pool");
        require(tokenIn > 0, "zero in");

        require(IERC20(token).transferFrom(msg.sender, address(this), tokenIn), "pull token");

        uint256 k = p.rToken * p.rUSDC;
        uint256 newRToken = p.rToken + tokenIn;
        uint256 newRUSDC = k / newRToken;
        uint256 usdcOut = p.rUSDC - newRUSDC;

        require(usdcOut >= minUsdcOut && usdcOut > 0, "slippage");

        p.rToken = newRToken;
        p.rUSDC = newRUSDC;

        require(usdc.transfer(msg.sender, usdcOut), "send usdc");

        emit Sold(token, msg.sender, tokenIn, usdcOut);
    }

    /**
     * @notice Burn tokens to completely remove them from circulation and grant dataset access
     * @dev Tokens are transferred from user and burned to address(0)
     * Pool reserves are reduced, keeping USDC constant, which increases price
     * Only by burning tokens can users download the dataset
     * @param token The token address to burn
     * @param amount The amount of tokens to burn (must be owned by caller)
     */
    function burnForAccess(address token, uint256 amount) external {
        Pool storage p = pools[token];
        require(p.exists, "no pool");
        require(amount > 0, "zero amount");

        // Value of tokens in USDC (6 decimals)
        require(p.rToken > 0, "empty pool");

        uint256 usdcValue = (amount * p.rUSDC) / p.rToken;
        require(usdcValue >= MIN_BURN_VALUE_USDC, "burn below minimum value");

        uint256 burnAmount = amount / 2;

        // Pull tokens from user to this contract
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "pull token");

        // All tokens now sit in the pool contract
        p.rToken += amount;

        // Burn 50% of the tokens to reduce total supply
        if (burnAmount > 0) {
            IDataCoin(token).burn(burnAmount);
            p.rToken -= burnAmount;
        }

        // returnAmount automatically deepens liquidity by remaining in the pool

        // Calculate new price after burn
        uint256 newPrice = (p.rUSDC * 1e18) / p.rToken;

        emit TokensBurned(token, msg.sender, amount, newPrice);
        emit AccessGranted(token, msg.sender);
    }

    function getPriceUSDCperToken(address token) external view returns (uint256) {
        Pool storage p = pools[token];
        require(p.exists, "no pool");
        if (p.rToken == 0) return 0;
        return (p.rUSDC * 1e18) / p.rToken;
    }

    function getReserves(address token) external view returns (uint256 rToken, uint256 rUSDC) {
        Pool storage p = pools[token];
        require(p.exists, "no pool");
        return (p.rToken, p.rUSDC);
    }

    function poolExists(address token) external view returns (bool) {
        return pools[token].exists;
    }
}
