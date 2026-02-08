// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { ArcTreasury } from "../src/ArcTreasury.sol";
import { MockERC20 } from "solmate/src/test/utils/mocks/MockERC20.sol";
import { IERC20 } from "@openzeppelin/token/ERC20/IERC20.sol";

contract ArcTreasuryTest is Test {
    ArcTreasury public treasury;
    MockERC20 public usdc;

    address public owner;
    address public agent1;
    address public agent2;
    address public recipient;

    uint256 constant MINT_AMOUNT = 1_000_000 * 1e6; // 1M USDC (6 decimals)

    function setUp() public {
        owner = makeAddr("owner");
        agent1 = makeAddr("agent1");
        agent2 = makeAddr("agent2");
        recipient = makeAddr("recipient");

        usdc = new MockERC20("USDC", "USDC", 6);
        usdc.mint(owner, MINT_AMOUNT);
        usdc.mint(agent1, MINT_AMOUNT);
        usdc.mint(agent2, MINT_AMOUNT);

        treasury = new ArcTreasury(owner, address(usdc));
    }

    function test_sweepProfit() public {
        uint256 amount = 1000 * 1e6;
        vm.prank(agent1);
        usdc.approve(address(treasury), amount);

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit ArcTreasury.ProfitSwept(agent1, amount);
        treasury.sweepProfit(agent1, amount);

        assertEq(usdc.balanceOf(agent1), MINT_AMOUNT - amount);
        assertEq(usdc.balanceOf(address(treasury)), amount);
    }

    function test_withdraw() public {
        uint256 amount = 1000 * 1e6;
        vm.prank(agent1);
        usdc.approve(address(treasury), amount);
        vm.prank(owner);
        treasury.sweepProfit(agent1, amount);

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit ArcTreasury.Withdrawn(recipient, amount);
        treasury.withdraw(recipient, amount);

        assertEq(usdc.balanceOf(address(treasury)), 0);
        assertEq(usdc.balanceOf(recipient), amount);
    }

    function test_multipleAgents_sweepAndWithdraw() public {
        uint256 a1 = 500 * 1e6;
        uint256 a2 = 300 * 1e6;

        vm.prank(agent1);
        usdc.approve(address(treasury), a1);
        vm.prank(agent2);
        usdc.approve(address(treasury), a2);

        vm.startPrank(owner);
        treasury.sweepProfit(agent1, a1);
        treasury.sweepProfit(agent2, a2);
        assertEq(usdc.balanceOf(address(treasury)), a1 + a2);

        treasury.withdraw(recipient, a1 + a2);
        vm.stopPrank();

        assertEq(usdc.balanceOf(recipient), a1 + a2);
        assertEq(usdc.balanceOf(address(treasury)), 0);
    }

    function test_sweepProfit_revertsWhenNotOwner() public {
        vm.prank(agent1);
        usdc.approve(address(treasury), 1000 * 1e6);

        vm.prank(agent1);
        vm.expectRevert();
        treasury.sweepProfit(agent1, 1000 * 1e6);
    }

    function test_sweepProfit_revertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ArcTreasury.ZeroAddress.selector);
        treasury.sweepProfit(address(0), 1000 * 1e6);
    }

    function test_sweepProfit_revertsZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(ArcTreasury.ZeroAmount.selector);
        treasury.sweepProfit(agent1, 0);
    }

    function test_withdraw_revertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ArcTreasury.ZeroAddress.selector);
        treasury.withdraw(address(0), 1000 * 1e6);
    }

    function test_withdraw_revertsZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(ArcTreasury.ZeroAmount.selector);
        treasury.withdraw(recipient, 0);
    }
}
