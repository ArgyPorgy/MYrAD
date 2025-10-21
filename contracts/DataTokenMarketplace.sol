// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IERC20 {
    function decimals() external view returns (uint8);
    function balanceOf(address) external view returns (uint256);
    function transfer(address to, uint256 amt) external returns (bool);
    function transferFrom(address from, address to, uint256 amt) external returns (bool);
    function approve(address spender, uint256 amt) external returns (bool);
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

    event PoolCreated(address indexed token, address indexed creator, uint256 tokenSeed, uint256 usdcSeed);
    event Bought(address indexed token, address indexed buyer, uint256 usdcIn, uint256 fee, uint256 tokensOut);
    event Sold(address indexed token, address indexed seller, uint256 tokensIn, uint256 usdcOut);
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
