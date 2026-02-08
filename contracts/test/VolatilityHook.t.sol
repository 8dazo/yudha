// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { Hooks } from "v4-core/libraries/Hooks.sol";
import { LPFeeLibrary } from "v4-core/libraries/LPFeeLibrary.sol";
import { IPoolManager } from "v4-core/interfaces/IPoolManager.sol";
import { IHooks } from "v4-core/interfaces/IHooks.sol";
import { PoolKey } from "v4-core/types/PoolKey.sol";
import { PoolId } from "v4-core/types/PoolId.sol";
import { BalanceDelta, BalanceDeltaLibrary } from "v4-core/types/BalanceDelta.sol";
import { StateLibrary } from "v4-core/libraries/StateLibrary.sol";
import { CustomRevert } from "v4-core/libraries/CustomRevert.sol";
import { Deployers } from "v4-core-test/utils/Deployers.sol";
import { Constants } from "v4-core-test/utils/Constants.sol";
import { VolatilityHook } from "../src/VolatilityHook.sol";

contract VolatilityHookTest is Test, Deployers {
    using StateLibrary for IPoolManager;
    using BalanceDeltaLibrary for BalanceDelta;

    VolatilityHook public volatilityHook;
    VolatilityHook public hookImpl;

    function setUp() public {
        // Hook address must have permission flags for all hooks we use (dynamic fee from beforeSwap)
        volatilityHook = VolatilityHook(
            address(
                uint160(
                    type(uint160).max & clearAllHookPermissionsMask | Hooks.BEFORE_INITIALIZE_FLAG
                        | Hooks.AFTER_INITIALIZE_FLAG | Hooks.BEFORE_ADD_LIQUIDITY_FLAG | Hooks.AFTER_ADD_LIQUIDITY_FLAG
                        | Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG | Hooks.AFTER_REMOVE_LIQUIDITY_FLAG | Hooks.BEFORE_SWAP_FLAG
                        | Hooks.AFTER_SWAP_FLAG | Hooks.BEFORE_DONATE_FLAG | Hooks.AFTER_DONATE_FLAG
                )
            )
        );

        deployFreshManagerAndRouters();
        hookImpl = new VolatilityHook(IPoolManager(manager));
        vm.etch(address(volatilityHook), address(hookImpl).code);
        volatilityHook.setManager(IPoolManager(manager));
        volatilityHook.setOwner(address(this));
        volatilityHook.updateVolatility(100); // etched storage starts at 0; set default multiplier

        deployMintAndApprove2Currencies();
        (key,) = initPoolAndAddLiquidity(
            currency0,
            currency1,
            IHooks(address(volatilityHook)),
            LPFeeLibrary.DYNAMIC_FEE_FLAG,
            SQRT_PRICE_1_1
        );
    }

    function test_updateVolatility_setsMultiplier() public {
        assertEq(volatilityHook.currentVolatilityMultiplier(), 100);
        volatilityHook.updateVolatility(200);
        assertEq(volatilityHook.currentVolatilityMultiplier(), 200);
    }

    function test_beforeSwap_returnsDynamicFeeFromMultiplier() public {
        // Higher multiplier => higher fee => less output for same input. Use larger amount so fee difference is visible.
        int256 swapAmount = -1_000_000;
        volatilityHook.updateVolatility(100);
        BalanceDelta delta100 = swap(key, true, swapAmount, Constants.ZERO_BYTES);

        volatilityHook.updateVolatility(200);
        BalanceDelta delta200 = swap(key, true, swapAmount, Constants.ZERO_BYTES);

        // 2x fee should give less output (amount1) than 1x
        assertLt(uint256(int256(delta200.amount1())), uint256(int256(delta100.amount1())), "Higher fee => less out");
    }

    function test_beforeSwap_feeScalesWithMultiplier() public {
        int256 swapAmount = -1_000_000;
        volatilityHook.updateVolatility(100);
        int128 out100 = swap(key, true, swapAmount, Constants.ZERO_BYTES).amount1();

        volatilityHook.updateVolatility(400);
        int128 out400 = swap(key, true, swapAmount, Constants.ZERO_BYTES).amount1();

        assertLt(int256(out400), int256(out100), "4x fee => less out than 1x");
    }

    function test_beforeAddLiquidity_revertsWhenVolatilityTooHigh() public {
        volatilityHook.updateVolatility(500); // 500 >= 500
        vm.expectRevert(
            abi.encodeWithSelector(
                CustomRevert.WrappedError.selector,
                address(volatilityHook),
                IHooks.beforeAddLiquidity.selector,
                abi.encodeWithSignature("Error(string)", "Volatility too high for new LP"),
                abi.encodeWithSelector(Hooks.HookCallFailed.selector)
            )
        );
        modifyLiquidityRouter.modifyLiquidity(key, LIQUIDITY_PARAMS, Constants.ZERO_BYTES);
    }

    function test_beforeAddLiquidity_succeedsWhenVolatilityBelow500() public {
        volatilityHook.updateVolatility(499);
        modifyLiquidityRouter.modifyLiquidity(key, LIQUIDITY_PARAMS, Constants.ZERO_BYTES);
    }

    function test_onlyOwner_canUpdateVolatility() public {
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert("Only owner");
        volatilityHook.updateVolatility(200);
    }
}
