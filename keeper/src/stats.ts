import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { formatEther, parseEther } from 'viem'
import { cfg } from './config.ts'
import { log, logErr } from './log.ts'

export interface DistributionRecord {
  t: string
  bnb: string
  holders: number
  txHash: string
}

export interface Stats {
  updatedAt: string
  launchAt: string | null
  phase: 'pre' | 'treasury' | 'rewards'
  totalBnbDistributed: string
  totalWethCollected: string
  treasuryWeth: string
  holdersPaidTotal: number
  uniqueHolders: number
  distributionCount: number
  lastDistribution: DistributionRecord | null
  nextRunAt: string | null
  history: DistributionRecord[]
}

const ZERO: Stats = {
  updatedAt: '',
  launchAt: null,
  phase: 'pre',
  totalBnbDistributed: '0',
  totalWethCollected: '0',
  treasuryWeth: '0',
  holdersPaidTotal: 0,
  uniqueHolders: 0,
  distributionCount: 0,
  lastDistribution: null,
  nextRunAt: null,
  history: [],
}

export function loadStats(): Stats {
  if (!existsSync(cfg.statsPath)) return { ...ZERO }
  return { ...ZERO, ...(JSON.parse(readFileSync(cfg.statsPath, 'utf8')) as Stats) }
}

export function addDecimal(a: string, weiDelta: bigint): string {
  // stats are stored as decimal strings; do the math in wei to stay exact
  return formatEther(parseEther(a) + weiDelta)
}

export function saveStats(stats: Stats): void {
  stats.updatedAt = new Date().toISOString()
  mkdirSync(dirname(cfg.statsPath), { recursive: true })
  writeFileSync(cfg.statsPath, JSON.stringify(stats, null, 2))

  if (cfg.sitePublishPath) {
    try {
      copyFileSync(cfg.statsPath, cfg.sitePublishPath)
      const repoDir = dirname(cfg.sitePublishPath)
      execFileSync('git', ['-C', repoDir, 'add', cfg.sitePublishPath], { stdio: 'pipe' })
      execFileSync(
        'git',
        ['-C', repoDir, 'commit', '-m', `stats: ${stats.totalBnbDistributed} BNB distributed`, '--quiet'],
        { stdio: 'pipe' },
      )
      execFileSync('git', ['-C', repoDir, 'push', '--quiet'], { stdio: 'pipe' })
      log('published stats.json to site repo')
    } catch (err) {
      // a failed publish must never block a distribution round
      logErr('stats publish failed (will retry next run)', err)
    }
  }
}
