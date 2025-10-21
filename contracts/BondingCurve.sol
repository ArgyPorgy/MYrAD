// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BondingCurve is ReentrancyGuard {
    IERC20 public token;
    address public creator;
    address public platform;

    event Buy(address indexed buyer, uint256 ethSent, uint256 tokensReceived);
    event Sell(address indexed seller, uint256 tokensSold, uint256 ethReceived);

    constructor(address _token, address _creator, address _platform) {
        token = IERC20(_token);
        creator = _creator;
        platform = _platform;
    }

    function getPrice() public view returns (uint256) {
        uint256 tokenBal = token.balanceOf(address(this));
        uint256 ethBal = address(this).balance;

        if (tokenBal == 0) return 0;
        // Price per token in wei (18 decimals)
        return (ethBal * 1e18) / tokenBal;
    }

    function getBuyAmount(uint256 ethAmount) public view returns (uint256) {
        require(ethAmount > 0, "ETH must be > 0");

        uint256 tokenBal = token.balanceOf(address(this));
        uint256 ethBal = address(this).balance;

        // Must have tokens and ETH in curve to trade
        if (tokenBal == 0 || ethBal == 0) {
            return 0;
        }

        // Linear bonding curve: price = ethBalance / tokenSupply
        // tokens received = ethAmount * tokenBalance / ethBalance
        uint256 tokensOut = (ethAmount * tokenBal) / ethBal;

        // Apply slippage (10%) when buying to account for price impact
        tokensOut = (tokensOut * 9) / 10;

        return tokensOut;
    }

    function getSellAmount(uint256 tokenAmount) public view returns (uint256) {
        require(tokenAmount > 0, "Token amount must be > 0");

        uint256 tokenBal = token.balanceOf(address(this));
        uint256 ethBal = address(this).balance;

        // Must have tokens and ETH in curve
        if (tokenBal == 0 || ethBal == 0) return 0;
        if (tokenAmount > tokenBal) return 0;

        // Simple linear formula: ethOut = tokenAmount * currentBalance / currentSupply
        // This is the inverse of buy pricing
        uint256 ethOut = (tokenAmount * ethBal) / tokenBal;
        
        // Apply slippage (10%) when selling
        ethOut = (ethOut * 9) / 10;

        return ethOut;
    }

    function buy() external payable nonReentrant {
        require(msg.value > 0, "ETH required");

        uint256 tokensToReceive = getBuyAmount(msg.value);
        require(tokensToReceive > 0, "Insufficient liquidity");

        uint256 tokenBal = token.balanceOf(address(this));
        require(tokenBal >= tokensToReceive, "Not enough tokens in curve");

        // Transfer tokens to buyer
        require(token.transfer(msg.sender, tokensToReceive), "Token transfer failed");

        emit Buy(msg.sender, msg.value, tokensToReceive);
    }

    function sell(uint256 tokenAmount) external nonReentrant {
        require(tokenAmount > 0, "Token amount required");

        uint256 userBal = token.balanceOf(msg.sender);
        require(userBal >= tokenAmount, "Insufficient token balance");

        uint256 ethToReceive = getSellAmount(tokenAmount);
        require(ethToReceive > 0, "Insufficient liquidity");

        uint256 ethBal = address(this).balance;
        require(ethBal >= ethToReceive, "Not enough ETH in curve");

        // Transfer tokens from seller to curve
        require(
            token.transferFrom(msg.sender, address(this), tokenAmount),
            "Token transfer failed"
        );

        // Transfer ETH to seller
        (bool success, ) = payable(msg.sender).call{value: ethToReceive}("");
        require(success, "ETH transfer failed");

        emit Sell(msg.sender, tokenAmount, ethToReceive);
    }

    function ethBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function tokenSupply() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
