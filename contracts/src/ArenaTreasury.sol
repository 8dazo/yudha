// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/token/ERC20/utils/SafeERC20.sol";
import {ERC20} from "@openzeppelin/token/ERC20/ERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/access/Ownable2Step.sol";

/**
 * @title ArenaTreasury
 * @notice USDC deposit mints Arena (play) tokens 1:1; owner can deduct play tokens when agents "play".
 */
contract ArenaTreasury is ERC20, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant USDC_SEPOLIA = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    uint8 private constant _DECIMALS = 6;

    address public immutable usdc;

    event Deposited(address indexed user, uint256 amount);
    event PlayDeducted(address indexed player, uint256 amount);

    error ZeroAddress();
    error ZeroAmount();

    constructor(address initialOwner, address usdcOverride) ERC20("Arena", "ARENA") Ownable(initialOwner) {
        usdc = usdcOverride != address(0) ? usdcOverride : USDC_SEPOLIA;
    }

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /**
     * @notice Deposit USDC and receive Arena (play) tokens 1:1.
     */
    function deposit(uint256 usdcAmount) external nonReentrant {
        if (usdcAmount == 0) revert ZeroAmount();
        IERC20(usdc).safeTransferFrom(msg.sender, address(this), usdcAmount);
        _mint(msg.sender, usdcAmount);
        emit Deposited(msg.sender, usdcAmount);
    }

    /**
     * @notice Owner mints Arena tokens (e.g. for initial distribution to test accounts).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        _mint(to, amount);
    }

    /**
     * @notice Owner (backend) deducts play tokens from a player when they "play".
     */
    function deductPlay(address player, uint256 amount) external onlyOwner nonReentrant {
        if (player == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        _burn(player, amount);
        emit PlayDeducted(player, amount);
    }
}
