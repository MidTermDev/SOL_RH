/**
 * Single place to fill in addresses/links once the token is live.
 * Empty strings render as "soon™" states in the UI instead of broken links.
 */
export const config = {
  ticker: 'SOL',
  name: 'Solana',
  chainName: 'Robinhood Chain',

  /** token contract address on Robinhood Chain — CREATE2-predicted pre-launch, verified by launch.ts */
  tokenAddress: '0xBfbf1db385cf7B6E5476146E0102F4655f30fa67',
  /** PONS bonding curve address (pre-graduation trading venue) */
  pairAddress: '0x9C21B472E24fD796DdBCcF25606F15B9ad478Ac7',
  /** treasury wallet */
  treasuryAddress: '0xAA03Cff328989FDDD5BF8EBb1EDEC3c75151b337',

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
