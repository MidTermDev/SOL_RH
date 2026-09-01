# SOL on HOOD

A token called **Solana ($SOL)**, launched on **Robinhood Chain**, paired with **WETH**, paying rewards in **real native BNB on BNB Chain**. Three ecosystems, zero respect, one flawlessly executed fee loop.

## How it works

```
        trade $SOL/WETH on Robinhood Chain
                      │ 5% fee
                      ▼
              keeper claims fees (WETH)
                      │
      ┌───── first 10 min after launch ─────┐
      │  100% → treasury (war chest for     │
      │        manual buybacks)             │
      └──────────────── then ───────────────┘
                      │
            30% → treasury (WETH)
            70% → bridged to BNB Chain,
                  swapped to native BNB
                      │
                      ▼
      pro-rata airdrop to every holder's wallet
      (same address, different chain — EOAs only)
```

Fun fact discovered while building this: **BNB does not exist on Robinhood Chain.** Nobody has ever bridged one — the canonical-bridge slot for it (`0xaCa855780cE199485a9E9EB415a1AD803DE4fAB5`) is empty. So instead of paying a wrapped IOU, the keeper bridges rewards out and pays real BNB on its home chain. Your address is the same on every EVM chain, so it just appears in your wallet.

## Repo layout

| dir | what |
|---|---|
| `site/` | the website — Vite + React + Tailwind, live stats dashboard fed by the keeper |
| `keeper/` | the bot — claims PONS fees, splits, bridges via LI.FI, airdrops BNB, publishes stats |
| `contracts/` | Foundry — `BatchDistributor.sol` (one-tx native BNB airdrops on BNB Chain) + tests |

## Verified chain facts (2026-09-01)

- Robinhood Chain mainnet: chain id **4663**, RPC `https://rpc.mainnet.chain.robinhood.com`, gas token ETH, explorer [robinhoodchain.blockscout.com](https://robinhoodchain.blockscout.com)
- Canonical WETH: `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73`
- Bridging: LI.FI / Relay / Across / Stargate are the aggregators Robinhood's own docs point to; the keeper uses LI.FI (4663 → 56, WETH → native BNB)

## Launch runbook

1. **Wallet prep** — one keeper wallet (fresh key). Fund it with a little ETH on Robinhood Chain (gas + claims) and ~0.05 BNB on BNB Chain (distribution gas). Keep the treasury on a separate wallet.
2. **Deploy the distributor** on BNB Chain:
   ```bash
   cd contracts
   forge script script/DeployDistributor.s.sol \
     --rpc-url https://bsc-rpc.publicnode.com --broadcast --private-key $KEEPER_PK
   ```
3. **Launch $SOL on PONS** (WETH pair, 5% fee) — see `docs/PONS.md`. Note the token address, pool address, launch block, and exact launch time.
4. **Configure the keeper** — `cp keeper/.env.example keeper/.env`, fill in every address, set `LAUNCH_AT`/`LAUNCH_BLOCK`, put the pool + locker into `EXCLUDED_ADDRESSES`.
5. **Fill in `site/src/config.ts`** (token, pair, treasury, explorer + chart links) and deploy the site (any static host; `npm run build` in `site/`).
6. **Arm the keeper**:
   ```bash
   cd keeper && npm install && npm start        # long-running loop
   # or RUN_ONCE=true node src/index.ts          # from cron/systemd
   ```
   For the first 10 minutes it shovels everything to the treasury; after that it does the 70/30 split forever. Set `SITE_PUBLISH_PATH` to auto-commit `stats.json` so the dashboard tracks every airdrop.

## Notes on fairness

- Rewards go to **EOAs only** (no code on either chain) — a contract address on Robinhood Chain isn't necessarily controlled by the same owner on BNB Chain, so contracts are skipped instead of misdelivered.
- Dust shares below the per-holder floor roll into the next round automatically.
- Every claim, split, bridge, and airdrop is on-chain; the site's table view lists every distribution tx.

## Disclaimers

Meme coin. 5% swap fee as described above. Not affiliated with Solana Labs, Binance, or Robinhood. No utility, no roadmap, no financial advice. You can lose everything.
