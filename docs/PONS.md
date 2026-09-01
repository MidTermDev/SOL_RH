# PONS V2 integration notes

Everything below was verified against Blockscout-verified source code and live `eth_call`s on Robinhood Chain mainnet (chain id 4663) on 2026-09-01. Official docs: [docs.ponsfamily.com/docs/v2](https://docs.ponsfamily.com/docs/v2) · app: [ponsfamily.com](https://www.ponsfamily.com).

## Why V2

PONS V1/V1.5 (Clanker-style instant Uniswap v3 WETH pools) is currently whitelist-gated (`launchEnabled() == false`). **V2 is the live public path**: a pump.fun-style bonding curve quoted in **native ETH** (phantom reserve 1.68 ETH) that auto-graduates at **4.2 ETH raised** into a **Uniswap v4 pool** with PONS's custom hook. The token itself is a plain OpenZeppelin ERC-20 deployed by the factory — no transfer tax, no owner functions; all fees are charged in the quote asset by the curve (pre-grad) and the hook (post-grad).

## Verified mainnet addresses

| contract | address |
|---|---|
| `PonsV2LaunchFactory` | `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e` |
| `V2FeeEscrow` (fees land here) | `0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e` |
| `V2MemeHook` (post-grad fees) | `0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044` |
| V2 launch locker (LP) | `0x267444D099b10fB5Ed7c3Cc7B7c767AdcA574952` |
| Uniswap v4 PoolManager | `0x8366a39CC670B4001A1121B8F6A443A643e40951` |

## Our launch parameters

- `launchToken(params, launchConfigId=0, pairToken=address(0))` with `msg.value == launchFee()` (0.0005 ETH). Config 0: 1B supply, 1% base curve fee, graduation at 4.2 ETH.
- `creatorTaxBps = 500` → **our 5% tax**, paid 100% to the creator fee recipient. Traders pay 6% total pre- and post-graduation (5% ours + 1% PONS base, of which we get 70% and PONS 30%).
- `creatorFeeRecipient = keeper wallet`, `buybackEnabled = false`, `expectedEconomics` pinned via `previewLaunchEconomics(0, address(0))` so PONS can't change terms between simulate and send.
- Launch **from the keeper wallet** — the deployer is who may call `sweepFees`.
- Anti-snipe: PONS applies a 99%→0 tax over the first 3 seconds (pooled with the base fee, not ours).

## Fee lifecycle (what the keeper does)

1. **Accrual** — pre-graduation on the curve (`quoteFeeBalance()`, `creatorTaxBalance()`); post-graduation on the hook (`pendingFees(poolId, currency)`, `pendingCreatorTax(poolId, currency)`).
2. **Sweep** — `curve.sweepFees(uint256 minBuybackTokensOut)` (deployer or PONS's `feeSweepOperator`; reverts `AlreadyGraduated` after graduation) / `hook.sweepPoolFees(bytes32 poolId, uint256 minConversionQuoteOut, uint256 minBuybackTokensOut)` (creator or operator; creator-only sweeps revert `InternalSwapRequiresOperator` when memecoin-side fees need conversion — PONS automation handles those, so our sweeps are best-effort).
3. **Claim** — `V2FeeEscrow.claim()` pays the recipient's full **native ETH** balance (`balanceOf(address)` to preview). Event `Claimed(address indexed recipient, uint256 amount)`.

## poolId derivation (no stored view exists)

```
currency0 = native ETH (zero address)  — always sorts first
currency1 = token
poolId    = keccak256(abi.encode(currency0, currency1, uint24 poolFee, int24 tickSpacing, address hook))
```
`poolFee` (0 — the hook charges fees, not the pool) and `tickSpacing` (200) come from `factory.getLaunchedToken(token)`.

## Gotchas

- Ticker "SOL" is free-form — PONS has no uniqueness check ("Names and symbols can be copied. Always check the token address.").
- Token metadata (logo URI, description, socials) is stored on-chain in the token and **immutable after launch**.
- PONS's own UI offers a per-token "holder fee sharing" distributor — we do NOT use it (its implementation is unverified on Blockscout, and it can't do cross-chain BNB anyway). Our keeper + `BatchDistributor` replaces it.
- `getLaunchedToken(token)` returns `(token, curve, deployer, creatorFeeRecipient, pairToken, graduationThreshold, poolFee, tickSpacing, creatorTaxBps, buybackEnabled, phase, sweptQuote, sweptTokens, sweptAt, exists)`.
