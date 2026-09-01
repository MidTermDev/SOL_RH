/** Shape of stats.json, published by the keeper after every run. */
export interface DistributionRecord {
  /** ISO timestamp of the run */
  t: string
  /** BNB distributed in this run (decimal string) */
  bnb: string
  /** holders paid in this run */
  holders: number
  txHash: string
}

export interface Stats {
  updatedAt: string
  /** ISO launch time; null before launch */
  launchAt: string | null
  phase: 'pre' | 'treasury' | 'rewards'
  /** cumulative BNB airdropped to holders (decimal string) */
  totalBnbDistributed: string
  /** cumulative ETH collected in fees (decimal string) */
  totalEthCollected: string
  /** cumulative ETH sent to treasury (decimal string) */
  treasuryEth: string
  /** cumulative number of individual payouts */
  holdersPaidTotal: number
  /** current unique holder count */
  uniqueHolders: number
  distributionCount: number
  lastDistribution: DistributionRecord | null
  nextRunAt: string | null
  history: DistributionRecord[]
}

export const EMPTY_STATS: Stats = {
  updatedAt: '',
  launchAt: null,
  phase: 'pre',
  totalBnbDistributed: '0',
  totalEthCollected: '0',
  treasuryEth: '0',
  holdersPaidTotal: 0,
  uniqueHolders: 0,
  distributionCount: 0,
  lastDistribution: null,
  nextRunAt: null,
  history: [],
}
