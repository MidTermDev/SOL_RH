import { config } from '../config'

const steps = [
  {
    n: '01',
    title: 'You trade $SOL',
    body: `Every buy and sell takes our ${config.tax.totalPct}% creator tax (PONS skims its own 1% on top — everyone eats). Launches on a PONS bonding curve vs ETH, graduates to a Uniswap v4 pool at 4.2 ETH raised. Standard degen stuff so far.`,
    accent: 'text-sol-purple',
  },
  {
    n: '02',
    title: `First ${config.tax.treasuryPhaseMinutes} minutes: war chest`,
    body: '100% of launch fees go straight to the treasury. That is the manual-buyback fund for when someone inevitably dumps on us. We planned for you.',
    accent: 'text-bnb',
  },
  {
    n: '03',
    title: 'Keeper claims the bag',
    body: `After the war-chest window, an on-schedule keeper bot claims all accrued fees. ${config.tax.treasuryPct}% goes to the treasury. The other ${config.tax.rewardsPct}% gets market-swapped into BNB.`,
    accent: 'text-sol-green',
  },
  {
    n: '04',
    title: 'BNB rains on holders',
    body: 'There is no BNB on Robinhood Chain (we checked — nobody has ever bridged it, which is very funny), so the keeper bridges your share to BNB Chain and airdrops REAL native BNB to the exact same wallet address you hold $SOL with. No staking. No claiming. It just appears, on an entirely different blockchain.',
    accent: 'text-bnb',
  },
]

export function TheTek() {
  return (
    <section id="tek" className="scroll-mt-28 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-drip text-drip rotate-[-0.5deg] text-3xl leading-relaxed sm:text-5xl">
          the tek
        </h2>
        <p className="mt-4 max-w-2xl text-ink-2">
          A token named after one chain, living on a second chain, paying rewards in a third chain's coin.{' '}
          <span className="font-marker text-toxic">three ecosystems, zero respect,</span> one flawlessly
          executed fee loop.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {steps.map((s) => (
            <div
              key={s.n}
              className={`group sticker-shadow rounded-3xl border-2 border-line bg-card p-6 transition duration-300 hover:rotate-0 hover:border-drank/50 hover:bg-card-2 ${['rotate-1', '-rotate-1', '-rotate-[0.75deg]', 'rotate-[0.75deg]'][Number(s.n) - 1]}`}
            >
              <div className={`font-marker text-xl ${s.accent}`}>{s.n}</div>
              <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.body}</p>
            </div>
          ))}
        </div>

        {/* the split, visually */}
        <div className="mt-6 rounded-3xl border-2 border-line bg-card p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">Where every fee goes (after minute {config.tax.treasuryPhaseMinutes})</span>
            <span className="font-mono text-xs text-ink-3">{config.tax.totalPct}% of volume</span>
          </div>
          <div className="mt-4 flex h-5 w-full gap-0.5 overflow-hidden rounded-full">
            <div className="rounded-l-full bg-chart-gold" style={{ width: `${config.tax.rewardsPct}%` }} />
            <div className="rounded-r-full bg-chart-green" style={{ width: `${config.tax.treasuryPct}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-2">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-chart-gold" /> {config.tax.rewardsPct}% → swapped to BNB, airdropped to holders
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-chart-green" /> {config.tax.treasuryPct}% → treasury (buybacks, chaos)
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
