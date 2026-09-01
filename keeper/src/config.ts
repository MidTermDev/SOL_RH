import { getAddress, type Address } from 'viem'

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback
  if (v === undefined) throw new Error(`Missing required env var ${name}`)
  return v
}

function envAddr(name: string, fallback?: string): Address {
  return getAddress(env(name, fallback))
}

function envAddrList(name: string): Address[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => getAddress(s))
}

export const cfg = {
  // ── chains ────────────────────────────────────────────────────────────────
  rhRpcUrl: env('RH_RPC_URL', 'https://rpc.mainnet.chain.robinhood.com'),
  bscRpcUrl: env('BSC_RPC_URL', 'https://bsc-rpc.publicnode.com'),

  // ── wallet ────────────────────────────────────────────────────────────────
  keeperPrivateKey: env('KEEPER_PRIVATE_KEY') as `0x${string}`,

  // ── addresses ─────────────────────────────────────────────────────────────
  /** $SOL token on Robinhood Chain (printed by launch.ts) */
  token: envAddr('TOKEN_ADDRESS'),
  /** treasury wallet on Robinhood Chain (receives the 30% + war-chest phase, in ETH) */
  treasury: envAddr('TREASURY_ADDRESS'),
  /** BatchDistributor on BNB Chain */
  distributor: envAddr('DISTRIBUTOR_ADDRESS'),
  /** never pay these (curve, locker, hook are auto-added; add anything extra here) */
  excluded: envAddrList('EXCLUDED_ADDRESSES'),

  // ── PONS (verified mainnet addresses, 2026-09-01 — see docs/PONS.md) ──────
  // curve address, graduation phase, and the v4 poolId are all derived from the
  // factory at runtime, so only the token address is needed after launch
  ponsFactory: envAddr('PONS_FACTORY', '0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e'),
  /** pull-payment escrow all creator fees land in (native ETH for ETH launches) */
  ponsFeeEscrow: envAddr('PONS_FEE_ESCROW', '0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e'),
  /** post-graduation Uniswap v4 hook that accrues swap fees */
  ponsHook: envAddr('PONS_HOOK', '0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044'),

  // ── schedule / economics ──────────────────────────────────────────────────
  /** ISO timestamp of launch; war-chest phase is measured from here */
  launchAt: env('LAUNCH_AT'),
  /** block the token launched at — Transfer indexing starts here */
  launchBlock: BigInt(env('LAUNCH_BLOCK', '0')),
  treasuryPhaseMinutes: Number(env('TREASURY_PHASE_MINUTES', '10')),
  /** post-phase split, basis points to rewards (rest → treasury) */
  rewardsBps: BigInt(env('REWARDS_BPS', '7000')),
  runIntervalMinutes: Number(env('RUN_INTERVAL_MINUTES', '30')),

  /** skip a run if claimable ETH is below this (wei) — not worth the bridge */
  minEthToProcess: BigInt(env('MIN_ETH_TO_PROCESS_WEI', String(5n * 10n ** 15n))), // 0.005 ETH
  /** ETH kept on Robinhood Chain for gas, never spent on rewards/treasury */
  gasReserveWei: BigInt(env('GAS_RESERVE_WEI', String(2n * 10n ** 15n))), // 0.002 ETH
  /** dust floor per holder per round (BNB wei); under this the share rolls over */
  minBnbPerHolder: BigInt(env('MIN_BNB_PER_HOLDER_WEI', String(10n ** 14n))), // 0.0001 BNB
  /** don't run a distribution at all under this pot (wei) — avoids 1-holder dust rounds */
  minBnbToDistribute: BigInt(env('MIN_BNB_TO_DISTRIBUTE_WEI', String(2n * 10n ** 16n))), // 0.02 BNB
  /** min $SOL balance to be reward-eligible (wei of token) */
  minTokenBalance: BigInt(env('MIN_TOKEN_BALANCE_WEI', '0')),
  /** recipients per distributeNative() call */
  batchSize: Number(env('BATCH_SIZE', '200')),
  /** bridge slippage, e.g. 0.01 = 1% */
  bridgeSlippage: env('BRIDGE_SLIPPAGE', '0.01'),

  // ── stats publishing ──────────────────────────────────────────────────────
  statsPath: env('STATS_PATH', new URL('../data/stats.json', import.meta.url).pathname),
  /** if set, stats.json is also copied here and git commit+pushed (feeds the site) */
  sitePublishPath: process.env.SITE_PUBLISH_PATH ?? '',

  logsChunkSize: BigInt(env('LOGS_CHUNK_SIZE', '5000')),
} as const

export const DEAD_ADDRESSES: Address[] = [
  '0x0000000000000000000000000000000000000000',
  '0x000000000000000000000000000000000000dEaD',
]
