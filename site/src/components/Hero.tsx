import { useState } from 'react'
import { config } from '../config'
import { shortAddr } from '../lib/format'

const tags = [
  '5% tax, weaponized 🔫',
  'BNB rewards. yes, BNB. 💀',
  'the most regarded tokenomics on mainnet',
  'zero utility, full transparency 🧠',
  '3 ecosystems disrespected at once',
  'a safe space for regards 🫂',
  'gud tek ✅',
]

function Sparkle({ className, delay }: { className: string; delay?: string }) {
  return (
    <span
      aria-hidden
      className={`twinkle pointer-events-none absolute select-none text-2xl ${className}`}
      style={{ animationDelay: delay ?? '0s' }}
    >
      ✦
    </span>
  )
}

export function Hero() {
  const [copied, setCopied] = useState(false)

  async function copyCA() {
    if (!config.tokenAddress) return
    await navigator.clipboard.writeText(config.tokenAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section id="top" className="bg-glow relative overflow-hidden px-4 pb-16 pt-32 sm:pt-40">
      {/* sparkle field */}
      <Sparkle className="left-[12%] top-[18%] text-white/80" />
      <Sparkle className="right-[14%] top-[14%] text-toxic" delay="0.5s" />
      <Sparkle className="left-[24%] top-[46%] text-drank" delay="1s" />
      <Sparkle className="right-[26%] top-[52%] text-white/70" delay="1.4s" />
      <Sparkle className="left-[8%] top-[64%] text-toxic" delay="0.8s" />
      <Sparkle className="right-[7%] top-[70%] text-drank" delay="0.2s" />

      {/* side stickers (desktop only) */}
      <div
        aria-hidden
        className="animate-float-slow pointer-events-none absolute left-[3%] top-[30%] hidden w-44 select-none text-center xl:block"
        style={{ '--float-rot': '-9deg' } as React.CSSProperties}
      >
        <div className="text-8xl drop-shadow-[0_0_24px_rgba(168,85,247,0.8)]">😈</div>
        <p className="font-creep mt-2 text-lg leading-tight text-toxic" style={{ textShadow: '0 0 8px rgba(57,255,20,.8), 1px 2px 0 #000' }}>
          my financial advisor disappeared after i aped 14 SOL into $SOL
        </p>
      </div>
      <div
        aria-hidden
        className="animate-float-slow pointer-events-none absolute right-[4%] top-[28%] hidden w-40 select-none text-center xl:block"
        style={{ '--float-rot': '10deg' } as React.CSSProperties}
      >
        <img src="./sol.svg" alt="" className="animate-spin-slow mx-auto h-24 w-24 rounded-3xl shadow-[0_0_40px_rgba(20,241,149,0.5)]" />
        <p className="font-marker mt-3 text-xl text-drank" style={{ textShadow: '0 0 10px rgba(168,85,247,.8)' }}>
          gud tek ↑
        </p>
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <div className="sticker-shadow mb-8 -rotate-2 rounded-full border-2 border-toxic/60 bg-card/80 px-4 py-1.5 font-marker text-sm text-toxic backdrop-blur">
          live on {config.chainName} · ETH pair · pays out in BNB 😈
        </div>

        <h1 className="font-chunk text-chrome -rotate-2 text-6xl leading-none sm:text-[7.5rem]">
          SOLANA
        </h1>
        <div className="font-creep mt-4 rotate-1 text-3xl tracking-wide text-toxic sm:text-4xl"
          style={{ textShadow: '0 0 6px rgba(57,255,20,.9), 0 0 24px rgba(57,255,20,.5), 2px 2px 0 #000' }}>
          financial advice? nah bro…
        </div>

        <p className="mt-6 max-w-xl text-lg text-ink-2">
          The token. Not the blockchain. It lives on{' '}
          <span className="font-semibold text-hood">Robinhood Chain</span>, trades against{' '}
          <span className="font-semibold text-ink">ETH</span>, and pays you{' '}
          <span className="font-semibold text-bnb">BNB</span> for holding it.
        </p>
        <p className="font-marker mt-3 -rotate-1 text-lg text-ink-2">
          we invest in projects thats build different{' '}
          <span className="font-drip text-xl text-drip">(mentally)</span>
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <a
            href={config.ponsUrl}
            target="_blank"
            rel="noreferrer"
            className="sticker-shadow hover-wiggle -rotate-1 rounded-2xl border-2 border-black bg-toxic px-8 py-4 font-chunk text-base text-black shadow-[0_0_34px_rgba(57,255,20,0.45)] transition hover:brightness-110"
          >
            BUY ON PONS →
          </a>
          <a
            href="#tek"
            className="sticker-shadow rotate-1 rounded-2xl border-2 border-drank/70 bg-card px-8 py-4 font-chunk text-base text-drank transition hover:bg-card-2"
          >
            READ THE TEK
          </a>
        </div>

        <button
          onClick={copyCA}
          className="font-marker mt-8 flex rotate-[0.5deg] items-center gap-2 text-lg text-toxic transition hover:brightness-125"
          style={{ textShadow: '0 0 8px rgba(57,255,20,.6), 1px 1px 0 #000' }}
          title={config.tokenAddress || 'contract address drops at launch'}
        >
          CA: {config.tokenAddress ? shortAddr(config.tokenAddress) : 'dropping at launch, stay regarded'}
          {config.tokenAddress && <span>{copied ? '✓ copied' : '⧉'}</span>}
        </button>
      </div>

      {/* marquee of shame */}
      <div className="mt-14 -rotate-1 scale-[1.02] overflow-hidden border-y-2 border-toxic/50 bg-black/60 py-3.5">
        <div className="animate-marquee font-creep flex w-max gap-10 whitespace-nowrap text-xl tracking-wider text-toxic"
          style={{ textShadow: '0 0 8px rgba(57,255,20,.7), 1px 1px 0 #000' }}>
          {[...tags, ...tags, ...tags].map((t, i) => (
            <span key={i} className="flex items-center gap-10">
              {t} <span className="text-drank">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
