// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { ArcTreasury } from "../src/ArcTreasury.sol";

contract DeployYudha is Script {
    ArcTreasury public treasury;

    function run() public {
        // Use ACCOUNT_1_PRIVATE_KEY from ai-backend/.env or PRIVATE_KEY
        uint256 deployerPrivateKey = vm.envOr("ACCOUNT_1_PRIVATE_KEY", uint256(0));
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        }
        if (deployerPrivateKey == 0) {
            revert("Set ACCOUNT_1_PRIVATE_KEY or PRIVATE_KEY in env for deployment");
        }

        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);
        treasury = new ArcTreasury(deployer);
        vm.stopBroadcast();

        console.log("ArcTreasury deployed at:", address(treasury));
    }
}
