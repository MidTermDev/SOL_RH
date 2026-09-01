// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BatchDistributor, IERC20} from "../src/BatchDistributor.sol";

contract MockToken is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// Recipient that rejects native transfers — simulates a contract wallet without receive().
contract Rejector {}

contract BatchDistributorTest is Test {
    BatchDistributor dist;
    MockToken token;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");

    function setUp() public {
        dist = new BatchDistributor();
        token = new MockToken();
    }

    function test_distributeNative() public {
        address[] memory to = new address[](3);
        to[0] = alice;
        to[1] = bob;
        to[2] = carol;
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;
        amounts[2] = 3 ether;

        dist.distributeNative{value: 6 ether}(to, amounts);

        assertEq(alice.balance, 1 ether);
        assertEq(bob.balance, 2 ether);
        assertEq(carol.balance, 3 ether);
        assertEq(address(dist).balance, 0);
    }

    function test_distributeNative_refundsFailedSends() public {
        Rejector rejector = new Rejector();
        address[] memory to = new address[](2);
        to[0] = alice;
        to[1] = address(rejector);
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;

        uint256 before = address(this).balance;
        dist.distributeNative{value: 3 ether}(to, amounts);

        assertEq(alice.balance, 1 ether);
        assertEq(address(rejector).balance, 0);
        // the 2 ether that couldn't be delivered came back
        assertEq(address(this).balance, before - 1 ether);
        assertEq(address(dist).balance, 0);
    }

    function test_distributeNative_revertsOnBadValue() public {
        address[] memory to = new address[](1);
        to[0] = alice;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 2 ether;

        vm.expectRevert(BatchDistributor.ValueMismatch.selector);
        dist.distributeNative{value: 1 ether}(to, amounts);
    }

    function test_distributeNative_revertsOnLengthMismatch() public {
        address[] memory to = new address[](2);
        uint256[] memory amounts = new uint256[](1);
        vm.expectRevert(BatchDistributor.LengthMismatch.selector);
        dist.distributeNative{value: 0}(to, amounts);
    }

    function test_distributeToken() public {
        token.mint(address(this), 100 ether);
        token.approve(address(dist), 100 ether);

        address[] memory to = new address[](2);
        to[0] = alice;
        to[1] = bob;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 40 ether;
        amounts[1] = 60 ether;

        dist.distributeToken(token, to, amounts);

        assertEq(token.balanceOf(alice), 40 ether);
        assertEq(token.balanceOf(bob), 60 ether);
        assertEq(token.balanceOf(address(this)), 0);
    }

    function testFuzz_distributeNative_conservesValue(uint96[8] calldata raw) public {
        address[] memory to = new address[](8);
        uint256[] memory amounts = new uint256[](8);
        uint256 total;
        for (uint256 i; i < 8; ++i) {
            to[i] = address(uint160(0x10000 + i));
            amounts[i] = uint256(raw[i]) % 10 ether;
            total += amounts[i];
        }
        vm.deal(address(this), total);
        dist.distributeNative{value: total}(to, amounts);
        uint256 delivered;
        for (uint256 i; i < 8; ++i) {
            delivered += to[i].balance;
        }
        assertEq(delivered, total);
        assertEq(address(dist).balance, 0);
    }

    receive() external payable {}
}
