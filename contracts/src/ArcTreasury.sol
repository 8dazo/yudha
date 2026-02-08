// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/access/Ownable2Step.sol";

/**
 * @title ArcTreasury
 * @notice Production-ready central treasury for sweeping agent profits into USDC (Arc).
 * @dev Uses SafeERC20, ReentrancyGuard, and two-step ownership transfer.
 */
contract ArcTreasury is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Official Circle USDC on Ethereum Sepolia (see developers.circle.com/stablecoins/usdc-contract-addresses)
    address public constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

    /// @notice Token used for sweeps/withdrawals (USDC or override for tests)
    address public immutable token;

    event ProfitSwept(address indexed agent, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    error ZeroAddress();
    error ZeroAmount();

    /// @param initialOwner Owner of the treasury.
    /// @param tokenOverride If non-zero, use this instead of USDC (for tests).
    constructor(address initialOwner, address tokenOverride) Ownable(initialOwner) {
        token = tokenOverride != address(0) ? tokenOverride : USDC;
    }

    /**
     * @notice Sweep profits from an agent wallet to the treasury.
     * @param _agent The agent's wallet address (must have approved this contract for USDC).
     * @param _amount Amount of USDC (6 decimals) to sweep.
     */
    function sweepProfit(address _agent, uint256 _amount) external onlyOwner nonReentrant {
        if (_agent == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmount();
        IERC20(token).safeTransferFrom(_agent, address(this), _amount);
        emit ProfitSwept(_agent, _amount);
    }

    /**
     * @notice Withdraw USDC from the treasury to a recipient.
     * @param _to Recipient address.
     * @param _amount Amount of USDC (6 decimals) to withdraw.
     */
    function withdraw(address _to, uint256 _amount) external onlyOwner nonReentrant {
        if (_to == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmount();
        IERC20(token).safeTransfer(_to, _amount);
        emit Withdrawn(_to, _amount);
    }
}
