// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IDataCoin {
    function burn(uint256 amount) external;
}

contract BondingCurve is ReentrancyGuard {
    IERC20 public token;
    IERC20 public usdc;
    address public creator;
    address public treasury;

    uint256 public constant FEE_BPS = 500; // 5% fee on BUY
    uint256 public constant BPS = 10_000;
    uint256 public constant MIN_BURN_VALUE_USDC = 500000; // 0.5 USDC (6 decimals)

    uint256 public rToken;  // Token reserves
    uint256 public rUSDC;   // USDC reserves

    event PoolInitialized(uint256 tokenAmount, uint256 usdcAmount);
    event Bought(address indexed buyer, uint256 usdcIn, uint256 fee, uint256 tokensOut);
    event Sold(address indexed seller, uint256 tokensIn, uint256 usdcOut);
    event TokensBurned(address indexed burner, uint256 amountBurned, uint256 newPrice);
    event AccessGranted(address indexed buyer);

    constructor(
        address _token,
        address _usdc,
        address _creator,
        address _treasury
    ) {
        token = IERC20(_token);
        usdc = IERC20(_usdc);
        creator = _creator;
        treasury = _treasury;
    }

    /**
     * @notice Initialize the liquidity pool (call once after deployment)
     */
    function initPool(uint256 tokenAmount, uint256 usdcAmount) external {
        require(rToken == 0 && rUSDC == 0, "Pool already initialized");
        require(tokenAmount > 0 && usdcAmount > 0, "Invalid amounts");

        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
        require(usdc.transferFrom(msg.sender, address(this), usdcAmount), "USDC transfer failed");

        rToken = tokenAmount;
        rUSDC = usdcAmount;

        emit PoolInitialized(tokenAmount, usdcAmount);
    }

    /**
     * @notice Get current price in USDC per token (18 decimals for precision)
     */
    function getPriceUSDCperToken() external view returns (uint256) {
        if (rToken == 0) return 0;
        return (rUSDC * 1e18) / rToken;
    }

    /**
     * @notice Get pool reserves
     */
    function getReserves() external view returns (uint256, uint256) {
        return (rToken, rUSDC);
    }

    /**
     * @notice Check if pool exists
     */
    function poolExists() external view returns (bool) {
        return rToken > 0 && rUSDC > 0;
    }

    /**
     * @notice Buy tokens with USDC
     */
    function buy(uint256 usdcIn, uint256 minTokensOut) external nonReentrant {
        require(usdcIn > 0, "zero in");
        require(rToken > 0 && rUSDC > 0, "no pool");

        require(usdc.transferFrom(msg.sender, address(this), usdcIn), "pull usdc");

        uint256 fee = (usdcIn * FEE_BPS) / BPS;
        uint256 usdcToPool = usdcIn - fee;

        uint256 toCreator = (fee * 8000) / BPS;
        uint256 toTreasury = fee - toCreator;
        require(usdc.transfer(creator, toCreator), "fee creator");
        require(usdc.transfer(treasury, toTreasury), "fee treas");

        uint256 k = rToken * rUSDC;
        uint256 newRUSDC = rUSDC + usdcToPool;
        uint256 newRToken = k / newRUSDC;
        uint256 tokensOut = rToken - newRToken;

        require(tokensOut >= minTokensOut && tokensOut > 0, "slippage");

        rUSDC = newRUSDC;
        rToken = newRToken;

        require(token.transfer(msg.sender, tokensOut), "send token");

        emit Bought(msg.sender, usdcIn, fee, tokensOut);
        emit AccessGranted(msg.sender);
    }

    /**
     * @notice Sell tokens for USDC
     */
    function sell(uint256 tokenIn, uint256 minUsdcOut) external nonReentrant {
        require(tokenIn > 0, "zero in");
        require(rToken > 0 && rUSDC > 0, "no pool");

        require(token.transferFrom(msg.sender, address(this), tokenIn), "pull token");

        uint256 k = rToken * rUSDC;
        uint256 newRToken = rToken + tokenIn;
        uint256 newRUSDC = k / newRToken;
        uint256 usdcOut = rUSDC - newRUSDC;

        require(usdcOut >= minUsdcOut && usdcOut > 0, "slippage");

        rToken = newRToken;
        rUSDC = newRUSDC;

        require(usdc.transfer(msg.sender, usdcOut), "send usdc");

        emit Sold(msg.sender, tokenIn, usdcOut);
    }

    /**
     * @notice Burn tokens for dataset access (50% burned, 50% stays in pool)
     * @dev Requires minimum $0.5 USDC worth of tokens
     */
    function burnForAccess(uint256 amount) external nonReentrant {
        require(amount > 0, "zero amount");
        require(rToken > 0 && rUSDC > 0, "no pool");

        // Calculate USDC value of tokens being burned
        uint256 usdcValue = (amount * rUSDC) / rToken;
        require(usdcValue >= MIN_BURN_VALUE_USDC, "burn below minimum value");

        // Split: 50% burned, 50% stays in pool
        uint256 burnAmount = amount / 2;

        // Pull tokens from user
        require(token.transferFrom(msg.sender, address(this), amount), "pull token");

        // Add all tokens to pool reserves first
        rToken += amount;

        // Burn 50% to remove from total supply
        if (burnAmount > 0) {
            IDataCoin(address(token)).burn(burnAmount);
            rToken -= burnAmount;
        }

        // The other 50% automatically stays in the pool (deepens liquidity)

        uint256 newPrice = (rUSDC * 1e18) / rToken;

        emit TokensBurned(msg.sender, amount, newPrice);
        emit AccessGranted(msg.sender);
    }
}
