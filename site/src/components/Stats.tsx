import { useEffect, useState } from 'react'
import { config } from '../config'
import { useBnbPrice } from '../hooks/useBnbPrice'
import { countdown, fmt, msUntil, timeAgo } from '../lib/format'
import type { Stats } from '../types'
import { RewardsChart } from './RewardsChart'

function Tile({ label, value, sub, tilt = '' }: { label: string; value: string; sub?: string; tilt?: string }) {
  return (
    <div className={`rounded-3xl border-2 border-line bg-card p-5 transition duration-300 hover:rotate-0 hover:border-toxic/50 ${tilt}`}>
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
  if (!iso) return <Tile label="Next distribution" value="soon™" sub="keeper not armed yet" tilt="-rotate-1" />
  const ms = msUntil(iso)
  return <Tile label="Next distribution" value={ms === 0 ? 'running…' : countdown(ms)} sub="keeper runs on schedule" tilt="-rotate-1" />
}

export function StatsSection({ stats, loaded }: { stats: Stats; loaded: boolean }) {
  const bnbUsd = useBnbPrice()
  return (
    <section id="stats" className="scroll-mt-28 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-chunk text-chrome -rotate-1 text-3xl sm:text-5xl">
          THE RECEIPTS
        </h2>
        <p className="mt-3 text-ink-2">
          Every fee claimed, every wei of BNB airdropped — tracked here, verifiable on-chain.{' '}
          <span className="font-marker text-toxic">trust nobody, read the txs 🧠</span>
        </p>

        {/* hero figure */}
        <div className="relative mt-8 rounded-3xl border-2 border-line bg-card p-8 sm:p-10">
          <div className="sticker-shadow font-marker absolute -top-4 right-6 rotate-6 rounded-xl border-2 border-black bg-bnb px-3 py-1 text-sm text-black">
            number go up ↗
          </div>
          <div className="text-sm text-ink-2">Total BNB airdropped to holders</div>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-5xl font-bold tracking-tight text-ink sm:text-7xl">
              {fmt(stats.totalBnbDistributed)}
            </span>
            <span className="font-display text-2xl font-semibold text-bnb sm:text-3xl">BNB</span>
            {bnbUsd !== null && Number(stats.totalBnbDistributed) > 0 && (
              <span className="font-display text-xl font-medium text-ink-2 sm:text-2xl">
                ≈ ${fmt(Number(stats.totalBnbDistributed) * bnbUsd, { maxDp: 0 })}
              </span>
            )}
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
            tilt="rotate-1"
          />
          <Tile
            label="Treasury war chest (ETH)"
            value={fmt(stats.treasuryEth)}
            sub={`${config.tax.treasuryPct}% cut + first ${config.tax.treasuryPhaseMinutes} min of fees`}
            tilt="-rotate-1"
          />
          <Tile
            label="Payouts sent"
            value={fmt(stats.holdersPaidTotal, { compact: true })}
            sub={`across ${stats.distributionCount} distributions`}
            tilt="rotate-[0.75deg]"
          />
          <NextRun iso={stats.nextRunAt} />
        </div>
      </div>
    </section>
  )
}
