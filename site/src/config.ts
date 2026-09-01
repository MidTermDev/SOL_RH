/**
 * Single place to fill in addresses/links once the token is live.
 * Empty strings render as "soon™" states in the UI instead of broken links.
 */
export const config = {
  ticker: 'SOL',
  name: 'Solana',
  chainName: 'Robinhood Chain',

  /** token contract address on Robinhood Chain — fill in at launch */
  tokenAddress: '',
  /** PONS bonding curve address (pre-graduation trading venue) — fill in at launch */
  pairAddress: '',
  /** treasury wallet */
  treasuryAddress: '',

  /** where holders buy */
  ponsUrl: 'https://www.ponsfamily.com',
  explorerUrl: '',

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
