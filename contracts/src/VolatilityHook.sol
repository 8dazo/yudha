// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {LPFeeLibrary} from "v4-core/libraries/LPFeeLibrary.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/types/BeforeSwapDelta.sol";

/**
 * @title VolatilityHook
 * @notice A Uniswap v4 hook that adjusts liquidity behavior based on volatility signals.
 */
contract VolatilityHook is IHooks {
    uint24 public constant BASE_FEE = 3000; // 0.3%
    uint24 public currentVolatilityMultiplier = 100; // 100 = 1x
    address public owner;
    IPoolManager public poolManager;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
        owner = msg.sender;
    }

    /// @notice Set pool manager (for test etch pattern when storage is empty). Callable only once.
    function setManager(IPoolManager _poolManager) external {
        require(address(poolManager) == address(0), "Manager already set");
        poolManager = _poolManager;
    }

    /// @notice Set owner (for test etch pattern when storage is empty). Callable only once.
    function setOwner(address _owner) external {
        require(owner == address(0), "Owner already set");
        owner = _owner;
    }

    /**
     * @notice Updates the volatility multiplier. Called by Stable Sarah (AI Agent).
     * @param _multiplier The new multiplier (100 = 1x, 200 = 2x, etc.)
     */
    function updateVolatility(uint24 _multiplier) external onlyOwner {
        currentVolatilityMultiplier = _multiplier;
    }

    function beforeInitialize(address, PoolKey calldata, uint160) external pure override returns (bytes4) {
        return IHooks.beforeInitialize.selector;
    }

    function afterInitialize(address, PoolKey calldata, uint160, int24) external pure override returns (bytes4) {
        return IHooks.afterInitialize.selector;
    }

    function beforeAddLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, bytes calldata) external view override returns (bytes4) {
        require(currentVolatilityMultiplier < 500, "Volatility too high for new LP");
        return IHooks.beforeAddLiquidity.selector;
    }

    function afterAddLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, BalanceDelta, BalanceDelta, bytes calldata) external pure override returns (bytes4, BalanceDelta) {
        return (IHooks.afterAddLiquidity.selector, BalanceDelta.wrap(0));
    }

    function beforeRemoveLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, bytes calldata) external pure override returns (bytes4) {
        return IHooks.beforeRemoveLiquidity.selector;
    }

    function afterRemoveLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, BalanceDelta, BalanceDelta, bytes calldata) external pure override returns (bytes4, BalanceDelta) {
        return (IHooks.afterRemoveLiquidity.selector, BalanceDelta.wrap(0));
    }

    function beforeSwap(address, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata) external view override returns (bytes4, BeforeSwapDelta, uint24) {
        uint24 dynamicFee = BASE_FEE * currentVolatilityMultiplier / 100;
        if (dynamicFee > LPFeeLibrary.MAX_LP_FEE) dynamicFee = LPFeeLibrary.MAX_LP_FEE;
        // Set override flag so the pool uses this fee for the swap (required for dynamic-fee pools in v4)
        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, dynamicFee | LPFeeLibrary.OVERRIDE_FEE_FLAG);
    }

    function afterSwap(address, PoolKey calldata, IPoolManager.SwapParams calldata, BalanceDelta, bytes calldata) external pure override returns (bytes4, int128) {
        return (IHooks.afterSwap.selector, 0);
    }

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        return IHooks.beforeDonate.selector;
    }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        return IHooks.afterDonate.selector;
    }
}
