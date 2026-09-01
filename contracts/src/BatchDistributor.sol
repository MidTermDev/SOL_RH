// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title BatchDistributor
/// @notice One-tx pro-rata airdrops. Deployed on BNB Chain for native BNB payouts
///         (and usable on any EVM chain for ERC-20 batches).
/// @dev Native sends deliberately do NOT revert the whole batch when a single
///      recipient fails (e.g. a contract without receive()); failed amounts are
///      returned to the caller so the keeper can roll them into the next round.
contract BatchDistributor {
    error LengthMismatch();
    error ValueMismatch();

    event Distributed(address indexed token, uint256 total, uint256 recipients, uint256 refunded);

    /// @notice Send native coin (BNB) to many recipients. msg.value must equal sum(amounts).
    function distributeNative(address[] calldata to, uint256[] calldata amounts) external payable {
        if (to.length != amounts.length) revert LengthMismatch();
        uint256 total;
        uint256 refund;
        for (uint256 i; i < to.length; ++i) {
            total += amounts[i];
            // 50k stipend: enough for EIP-7702 smart-account receive hooks,
            // still bounded so one hostile recipient can't grief the batch
            (bool ok,) = to[i].call{value: amounts[i], gas: 50_000}("");
            if (!ok) refund += amounts[i];
        }
        if (msg.value != total) revert ValueMismatch();
        if (refund > 0) {
            (bool ok,) = msg.sender.call{value: refund}("");
            require(ok, "refund failed");
        }
        emit Distributed(address(0), total - refund, to.length, refund);
    }

    /// @notice Pull `sum(amounts)` of `token` from the caller, push to recipients.
    function distributeToken(IERC20 token, address[] calldata to, uint256[] calldata amounts) external {
        if (to.length != amounts.length) revert LengthMismatch();
        uint256 total;
        for (uint256 i; i < to.length; ++i) {
            total += amounts[i];
        }
        require(token.transferFrom(msg.sender, address(this), total), "pull failed");
        for (uint256 i; i < to.length; ++i) {
            require(token.transfer(to[i], amounts[i]), "push failed");
        }
        emit Distributed(address(token), total, to.length, 0);
    }
}
