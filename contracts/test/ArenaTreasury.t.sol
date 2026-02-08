// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { ArenaTreasury } from "../src/ArenaTreasury.sol";
import { MockERC20 } from "solmate/src/test/utils/mocks/MockERC20.sol";

contract ArenaTreasuryTest is Test {
    ArenaTreasury public arena;
    MockERC20 public usdc;

    address public owner;
    address public player1;
    address public player2;

    uint256 constant MINT_AMOUNT = 1_000_000 * 1e6;

    function setUp() public {
        owner = makeAddr("owner");
        player1 = makeAddr("player1");
        player2 = makeAddr("player2");

        usdc = new MockERC20("USDC", "USDC", 6);
        usdc.mint(player1, MINT_AMOUNT);
        usdc.mint(player2, MINT_AMOUNT);

        arena = new ArenaTreasury(owner, address(usdc));
    }

    function test_deposit_mintsArena() public {
        uint256 amount = 1000 * 1e6;
        vm.startPrank(player1);
        usdc.approve(address(arena), amount);
        vm.expectEmit(true, true, true, true);
        emit ArenaTreasury.Deposited(player1, amount);
        arena.deposit(amount);
        vm.stopPrank();

        assertEq(arena.balanceOf(player1), amount);
        assertEq(usdc.balanceOf(address(arena)), amount);
        assertEq(usdc.balanceOf(player1), MINT_AMOUNT - amount);
    }

    function test_deductPlay_burnsFromPlayer() public {
        uint256 amount = 1000 * 1e6;
        vm.startPrank(player1);
        usdc.approve(address(arena), amount);
        arena.deposit(amount);
        vm.stopPrank();

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit ArenaTreasury.PlayDeducted(player1, amount / 2);
        arena.deductPlay(player1, amount / 2);

        assertEq(arena.balanceOf(player1), amount / 2);
    }

    function test_deductPlay_onlyOwner() public {
        uint256 amount = 1000 * 1e6;
        vm.startPrank(player1);
        usdc.approve(address(arena), amount);
        arena.deposit(amount);
        vm.stopPrank();

        vm.prank(player2);
        vm.expectRevert();
        arena.deductPlay(player1, amount);
    }

    function test_deposit_revertsZeroAmount() public {
        vm.prank(player1);
        vm.expectRevert(ArenaTreasury.ZeroAmount.selector);
        arena.deposit(0);
    }

    function test_deductPlay_revertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ArenaTreasury.ZeroAddress.selector);
        arena.deductPlay(address(0), 100);
    }
}
