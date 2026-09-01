import { useEffect, useState } from 'react'
import { config } from '../config'
import { countdown, fmt, msUntil, timeAgo } from '../lib/format'
import type { Stats } from '../types'
import { RewardsChart } from './RewardsChart'

function PhaseBadge({ stats }: { stats: Stats }) {
  const map = {
    pre: { txt: 'pre-launch', dot: 'bg-ink-3' },
    treasury: { txt: 'war-chest phase — all fees → treasury', dot: 'bg-bnb' },
    rewards: { txt: 'rewards phase — 70% → BNB airdrops', dot: 'bg-sol-green' },
  } as const
  const m = map[stats.phase]
  return (
    <span className="flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-medium text-ink-2">
      <span className={`h-2 w-2 rounded-full ${m.dot} ${stats.phase !== 'pre' ? 'animate-pulse' : ''}`} />
      {m.txt}
    </span>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-line bg-card p-5">
      <div className="text-sm text-ink-2">{label}</div>
      <div className="mt-1.5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-3">{sub}</div>}
    </div>
  )
}

function NextRun({ iso }: { iso: string | null }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  if (!iso) return <Tile label="Next distribution" value="soon™" sub="keeper not armed yet" />
  const ms = msUntil(iso)
  return <Tile label="Next distribution" value={ms === 0 ? 'running…' : countdown(ms)} sub="keeper runs on schedule" />
}

export function StatsSection({ stats, loaded }: { stats: Stats; loaded: boolean }) {
  return (
    <section id="stats" className="scroll-mt-28 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            The receipts<span className="text-sol-green">.</span>
          </h2>
          <PhaseBadge stats={stats} />
        </div>
        <p className="mt-2 text-ink-2">
          Every fee claimed, every wei of BNB airdropped — tracked here, verifiable on-chain.
        </p>

        {/* hero figure */}
        <div className="mt-8 rounded-3xl border border-line bg-card p-8 sm:p-10">
          <div className="text-sm text-ink-2">Total BNB airdropped to holders</div>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-5xl font-bold tracking-tight text-ink sm:text-7xl">
              {fmt(stats.totalBnbDistributed)}
            </span>
            <span className="font-display text-2xl font-semibold text-bnb sm:text-3xl">BNB</span>
          </div>
          <div className="mt-2 text-xs text-ink-3">
            {stats.lastDistribution
              ? `last airdrop ${timeAgo(stats.lastDistribution.t)} · ${fmt(stats.lastDistribution.bnb)} BNB to ${stats.lastDistribution.holders} holders`
              : loaded
                ? 'first airdrop lands after launch + ' + config.tax.treasuryPhaseMinutes + ' minutes'
                : 'loading…'}
          </div>

          <RewardsChart history={stats.history} />
        </div>

        {/* tiles */}
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Tile
            label="Fees collected (ETH)"
            value={fmt(stats.totalEthCollected)}
            sub="5% of every swap, claimed by the keeper"
          />
          <Tile
            label="Treasury war chest (ETH)"
            value={fmt(stats.treasuryEth)}
            sub={`${config.tax.treasuryPct}% cut + first ${config.tax.treasuryPhaseMinutes} min of fees`}
          />
          <Tile
            label="Payouts sent"
            value={fmt(stats.holdersPaidTotal, { compact: true })}
            sub={`across ${stats.distributionCount} distributions`}
          />
          <NextRun iso={stats.nextRunAt} />
        </div>
      </div>
    </section>
  )
}
