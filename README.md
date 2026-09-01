# SOL on HOOD

A token called **Solana ($SOL)**, launched via **PONS** on **Robinhood Chain**, trading against **ETH**, paying rewards in **real native BNB on BNB Chain**. Three ecosystems, zero respect, one flawlessly executed fee loop.

## How it works

```
   trade $SOL on Robinhood Chain (PONS curve → Uniswap v4, ETH quote)
                      │ 5% creator tax (+1% PONS base fee)
                      ▼
        keeper sweeps + claims fees from the PONS escrow (native ETH)
                      │
      ┌───── first 10 min after launch ─────┐
      │  100% → treasury (war chest for     │
      │        manual buybacks)             │
      └──────────────── then ───────────────┘
                      │
            30% → treasury (ETH)
            70% → bridged to BNB Chain via LI.FI,
                  arrives as native BNB
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
- PONS V2 contracts (factory, fee escrow, v4 hook): see [docs/PONS.md](docs/PONS.md) — all Blockscout-verified
- Bridging: LI.FI / Relay / Across / Stargate are the aggregators Robinhood's own docs point to; the keeper uses LI.FI (4663 → 56, native ETH → native BNB, route tested live)

## Launch runbook

1. **Wallet prep** — one keeper wallet (fresh key). Fund it with a little ETH on Robinhood Chain (gas + claims) and ~0.05 BNB on BNB Chain (distribution gas). Keep the treasury on a separate wallet.
2. **Deploy the distributor** on BNB Chain:
   ```bash
   cd contracts
   forge script script/DeployDistributor.s.sol \
     --rpc-url https://bsc-rpc.publicnode.com --broadcast --private-key $KEEPER_PK
   ```
3. **Launch $SOL on PONS** from the keeper wallet (it must be the deployer to sweep fees):
   ```bash
   cd keeper && npm install
   KEEPER_PRIVATE_KEY=0x... node src/launch.ts               # dry run: simulates, prints token + curve
   KEEPER_PRIVATE_KEY=0x... CONFIRM=yes node src/launch.ts   # broadcasts, prints .env lines to paste
   ```
   This launches with `creatorTaxBps=500` (our 5%), native ETH quote, buybacks off, economics pinned. See `docs/PONS.md` for every verified detail.
4. **Configure the keeper** — `cp keeper/.env.example keeper/.env`, paste the `TOKEN_ADDRESS`/`LAUNCH_AT`/`LAUNCH_BLOCK` lines the launch script printed, set the treasury + distributor addresses. PONS's curve/hook/escrow/locker are auto-excluded from rewards.
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

Meme coin. 5% creator tax as described above (PONS adds its own 1% base fee). Not affiliated with Solana Labs, Binance, Robinhood, or PONS. No utility, no roadmap, no financial advice. You can lose everything.
