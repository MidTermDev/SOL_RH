/**
 * Single place to fill in addresses/links once the token is live.
 * Empty strings render as "soon™" states in the UI instead of broken links.
 */
export const config = {
  ticker: 'SOL',
  name: 'Solana',
  chainName: 'Robinhood Chain',

  /** token contract address on Robinhood Chain — CREATE2-predicted pre-launch, verified by launch.ts */
  tokenAddress: '0x5C40BA1C0c31c50f78BEF2B599b5CDd6BBb58E0d',
  /** PONS bonding curve address (pre-graduation trading venue) */
  pairAddress: '0x8Ff4aA3c5289F7211BF40660B9E2F2e356C03de0',
  /** treasury wallet */
  treasuryAddress: '0xD9eb7B96727f5fb10Aa4E6F9dC3b5508C01954Ac',

  /** where holders buy */
  ponsUrl: 'https://www.ponsfamily.com',
  explorerUrl: 'https://robinhoodchain.blockscout.com',

  /** stats.json published by the keeper (same-origin by default) */
  statsUrl: (import.meta.env.VITE_STATS_URL as string | undefined) ?? 'stats.json',
  /** how often the UI re-polls stats, ms */
  statsPollMs: 30_000,

  links: {
    twitter: '',
    telegram: '',
    github: 'https://github.com/MidTermDev',
    chart: '',
  },

  tax: {
    totalPct: 5,
    rewardsPct: 70,
    treasuryPct: 30,
    /** during this window after launch, 100% of fees go to treasury */
    treasuryPhaseMinutes: 10,
  },
} as const
