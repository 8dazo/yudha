// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { ArenaTreasury } from "../src/ArenaTreasury.sol";

contract DeployArena is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envOr("ACCOUNT_1_PRIVATE_KEY", uint256(0));
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        }
        if (deployerPrivateKey == 0) {
            revert("Set ACCOUNT_1_PRIVATE_KEY or PRIVATE_KEY in env for deployment");
        }

        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);
        ArenaTreasury arena = new ArenaTreasury(deployer, address(0));
        vm.stopBroadcast();

        console.log("ArenaTreasury deployed at:", address(arena));
    }
}
