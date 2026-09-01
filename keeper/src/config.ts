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
  /** $SOL token on Robinhood Chain */
  token: envAddr('TOKEN_ADDRESS'),
  /** canonical WETH on Robinhood Chain (verified via official docs) */
  weth: envAddr('WETH_ADDRESS', '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73'),
  /** treasury wallet on Robinhood Chain (receives the 30% + war-chest phase) */
  treasury: envAddr('TREASURY_ADDRESS'),
  /** BatchDistributor on BNB Chain */
  distributor: envAddr('DISTRIBUTOR_ADDRESS'),
  /** never pay these (pool, locker, token contract, burn addrs are auto-added) */
  excluded: envAddrList('EXCLUDED_ADDRESSES'),

  // ── PONS fee claiming ─────────────────────────────────────────────────────
  /** PONS contract the keeper claims accrued creator fees from */
  ponsFeeContract: process.env.PONS_FEE_CONTRACT ? getAddress(process.env.PONS_FEE_CONTRACT) : null,

  // ── schedule / economics ──────────────────────────────────────────────────
  /** ISO timestamp of launch; war-chest phase is measured from here */
  launchAt: env('LAUNCH_AT'),
  /** block the token launched at — Transfer indexing starts here */
  launchBlock: BigInt(env('LAUNCH_BLOCK', '0')),
  treasuryPhaseMinutes: Number(env('TREASURY_PHASE_MINUTES', '10')),
  /** post-phase split, basis points to rewards (rest → treasury) */
  rewardsBps: BigInt(env('REWARDS_BPS', '7000')),
  runIntervalMinutes: Number(env('RUN_INTERVAL_MINUTES', '30')),

  /** skip a run if claimed fees are below this much WETH (wei) — not worth the bridge */
  minWethToProcess: BigInt(env('MIN_WETH_TO_PROCESS_WEI', String(5n * 10n ** 15n))), // 0.005 WETH
  /** dust floor per holder per round (BNB wei); under this the share rolls over */
  minBnbPerHolder: BigInt(env('MIN_BNB_PER_HOLDER_WEI', String(10n ** 14n))), // 0.0001 BNB
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
