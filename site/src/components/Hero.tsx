import { useState } from 'react'
import { config } from '../config'
import { shortAddr } from '../lib/format'

const tags = ['5% tax, weaponized', 'BNB rewards. yes, BNB.', 'zero utility, full transparency', '3 ecosystems disrespected at once']

export function Hero() {
  const [copied, setCopied] = useState(false)

  async function copyCA() {
    if (!config.tokenAddress) return
    await navigator.clipboard.writeText(config.tokenAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section id="top" className="bg-glow relative overflow-hidden px-4 pb-16 pt-36 sm:pt-44">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <div className="animate-float-slow mb-6 flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-1.5 text-xs font-medium text-ink-2 backdrop-blur">
          <span className="inline-block h-2 w-2 rounded-full bg-sol-green" />
          live on {config.chainName} · ETH pair · pays out in BNB
        </div>

        <h1 className="font-display text-6xl font-bold leading-none tracking-tighter sm:text-8xl">
          <span className="text-gradient">SOLANA</span>
        </h1>

        <p className="mt-4 max-w-xl text-lg text-ink-2">
          The token. Not the blockchain. It lives on{' '}
          <span className="font-semibold text-hood">Robinhood Chain</span>, trades against{' '}
          <span className="font-semibold text-ink">ETH</span>, and pays you{' '}
          <span className="font-semibold text-bnb">BNB</span> for holding it.
        </p>
        <p className="mt-2 text-sm text-ink-3">Nothing about this makes sense. That is the tek.</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={config.ponsUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-sol-green px-7 py-3.5 font-display text-base font-semibold text-black shadow-lg shadow-sol-green/20 transition hover:scale-[1.03] hover:brightness-110"
          >
            Buy on PONS →
          </a>
          <a
            href="#tek"
            className="rounded-full border border-line bg-card px-7 py-3.5 font-display text-base font-semibold text-ink transition hover:bg-card-2"
          >
            Read the tek
          </a>
        </div>

        <button
          onClick={copyCA}
          className="mt-6 flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-2 font-mono text-xs text-ink-2 transition hover:text-ink"
          title={config.tokenAddress || 'contract address drops at launch'}
        >
          <span className="text-ink-3">CA:</span>
          {config.tokenAddress ? shortAddr(config.tokenAddress) : 'dropping at launch'}
          {config.tokenAddress && <span className="text-ink-3">{copied ? '✓ copied' : '⧉'}</span>}
        </button>
      </div>

      {/* marquee of shame */}
      <div className="mt-14 overflow-hidden border-y border-line bg-card/40 py-3">
        <div className="animate-marquee flex w-max gap-8 whitespace-nowrap font-mono text-xs text-ink-3">
          {[...tags, ...tags, ...tags, ...tags].map((t, i) => (
            <span key={i} className="flex items-center gap-8">
              {t} <span className="text-sol-purple">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
