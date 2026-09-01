import { useMemo, useRef, useState } from 'react'
import { fmt, timeAgo } from '../lib/format'
import type { DistributionRecord } from '../types'

/**
 * Cumulative BNB distributed over time. Single series — the card's title names it,
 * so no legend. 2px line, 10%-opacity area wash, hairline gridlines, crosshair +
 * tooltip on hover, and a table view for accessibility.
 */

const W = 720
const H = 220
const PAD = { top: 12, right: 12, bottom: 24, left: 46 }

interface Pt {
  x: number
  y: number
  t: string
  cum: number
  rec: DistributionRecord
}

function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1]
  const raw = max / 3
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? mag * 10
  // the top tick must clear max, or the line draws above the plot area
  const ticks: number[] = []
  for (let v = 0; ; v += step) {
    ticks.push(v)
    if (v >= max) break
  }
  return ticks
}

export function RewardsChart({ history }: { history: DistributionRecord[] }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [hover, setHover] = useState<Pt | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const { pts, ticks, yMax } = useMemo(() => {
    let cum = 0
    const cums = history.map((r) => {
      cum += Number(r.bnb)
      return cum
    })
    const yMax = Math.max(cum, 0.0001)
    const ticks = niceTicks(yMax)
    const yTop = ticks[ticks.length - 1]
    const t0 = history.length ? new Date(history[0].t).getTime() : 0
    const t1 = history.length ? new Date(history[history.length - 1].t).getTime() : 1
    const span = Math.max(t1 - t0, 1)
    const pts: Pt[] = history.map((r, i) => ({
      x: PAD.left + ((new Date(r.t).getTime() - t0) / span) * (W - PAD.left - PAD.right),
      y: PAD.top + (1 - cums[i] / yTop) * (H - PAD.top - PAD.bottom),
      t: r.t,
      cum: cums[i],
      rec: r,
    }))
    return { pts, ticks, yMax: yTop }
  }, [history])

  if (history.length === 0) {
    return (
      <div className="mt-8 flex h-44 items-center justify-center rounded-2xl border border-dashed border-line text-sm text-ink-3">
        the line appears after the first airdrop. it only goes up (it's cumulative, it literally can't not).
      </div>
    )
  }

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * W
    let best: Pt | null = null
    let bd = Infinity
    for (const p of pts) {
      const d = Math.abs(p.x - mx)
      if (d < bd) {
        bd = d
        best = p
      }
    }
    setHover(best)
  }

  const yOf = (v: number) => PAD.top + (1 - v / yMax) * (H - PAD.top - PAD.bottom)
  const baseline = H - PAD.bottom
  const areaPath =
    pts.length > 1
      ? `M ${pts[0].x} ${baseline} ` + pts.map((p) => `L ${p.x} ${p.y}`).join(' ') + ` L ${pts[pts.length - 1].x} ${baseline} Z`
      : ''
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const last = pts[pts.length - 1]

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-ink-3">Cumulative BNB distributed</div>
        <div className="flex gap-1 rounded-full border border-line p-0.5 text-xs">
          {(['chart', 'table'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 capitalize transition ${view === v ? 'bg-white/10 text-ink' : 'text-ink-3 hover:text-ink-2'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'chart' ? (
        <div className="relative mt-3">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
            role="img"
            aria-label="Cumulative BNB distributed over time"
          >
            {/* hairline gridlines + y ticks (text in ink tokens, never series color) */}
            {ticks.map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={W - PAD.right} y1={yOf(v)} y2={yOf(v)} stroke="var(--color-grid)" strokeWidth="1" />
                <text x={PAD.left - 8} y={yOf(v) + 3.5} textAnchor="end" fontSize="10" fill="var(--color-ink-3)">
                  {fmt(v, { compact: true, maxDp: 2 })}
                </text>
              </g>
            ))}
            <line x1={PAD.left} x2={W - PAD.right} y1={baseline} y2={baseline} stroke="var(--color-axis)" strokeWidth="1" />

            {/* area wash + 2px line, validated gold */}
            {areaPath && <path d={areaPath} fill="var(--color-chart-gold)" opacity="0.1" />}
            <path d={linePath} fill="none" stroke="var(--color-chart-gold)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {/* end marker with surface ring + selective end label */}
            <circle cx={last.x} cy={last.y} r="6" fill="var(--color-card)" />
            <circle cx={last.x} cy={last.y} r="4" fill="var(--color-chart-gold)" />
            <text
              x={Math.min(last.x + 9, W - PAD.right)}
              y={Math.max(last.y - 8, 12)}
              fontSize="11"
              fontWeight="600"
              fill="var(--color-ink)"
              textAnchor={last.x > W - 90 ? 'end' : 'start'}
            >
              {fmt(last.cum)} BNB
            </text>

            {/* crosshair */}
            {hover && (
              <g pointerEvents="none">
                <line x1={hover.x} x2={hover.x} y1={PAD.top} y2={baseline} stroke="var(--color-axis)" strokeWidth="1" />
                <circle cx={hover.x} cy={hover.y} r="6" fill="var(--color-card)" />
                <circle cx={hover.x} cy={hover.y} r="4" fill="var(--color-chart-gold)" />
              </g>
            )}
          </svg>

          {hover && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-line bg-card-2 px-3 py-2 text-xs shadow-xl"
              style={{ left: `${(hover.x / W) * 100}%`, top: 0 }}
            >
              <div className="font-medium text-ink">{fmt(hover.cum)} BNB total</div>
              <div className="mt-0.5 text-ink-3">
                +{fmt(hover.rec.bnb)} to {hover.rec.holders} holders · {timeAgo(hover.t)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-line">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-card-2 text-ink-3">
              <tr>
                <th className="px-4 py-2.5 font-medium">When</th>
                <th className="px-4 py-2.5 font-medium">BNB paid</th>
                <th className="px-4 py-2.5 font-medium">Holders</th>
                <th className="px-4 py-2.5 font-medium">Tx</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums text-ink-2">
              {[...history].reverse().map((r) => (
                <tr key={r.txHash + r.t} className="border-t border-line">
                  <td className="px-4 py-2.5">{new Date(r.t).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{fmt(r.bnb)}</td>
                  <td className="px-4 py-2.5">{r.holders}</td>
                  <td className="px-4 py-2.5">{r.txHash.slice(0, 10)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
