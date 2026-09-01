// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BatchDistributor} from "../src/BatchDistributor.sol";

/// Deploy to BNB Chain (where native BNB payouts happen):
///   forge script script/DeployDistributor.s.sol --rpc-url https://bsc-rpc.publicnode.com --broadcast --private-key $KEEPER_PK
contract DeployDistributor is Script {
    function run() external {
        vm.startBroadcast();
        BatchDistributor dist = new BatchDistributor();
        console.log("BatchDistributor:", address(dist));
        vm.stopBroadcast();
    }
}
