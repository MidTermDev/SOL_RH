import { config } from '../config'

export function Footer() {
  return (
    <footer className="border-t border-line px-4 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-2.5">
          <img src="./sol.svg" alt="" className="animate-spin-slow h-8 w-8 rounded-xl" />
          <span className="font-display text-lg font-bold tracking-tight">
            SOL<span className="text-ink-3">·on·</span>
            <span className="text-hood">HOOD</span>
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-ink-2">
          {config.links.twitter && <a className="hover:text-ink" href={config.links.twitter} target="_blank" rel="noreferrer">Twitter</a>}
          {config.links.telegram && <a className="hover:text-ink" href={config.links.telegram} target="_blank" rel="noreferrer">Telegram</a>}
          <a className="hover:text-ink" href={config.ponsUrl} target="_blank" rel="noreferrer">PONS</a>
          {config.links.chart && <a className="hover:text-ink" href={config.links.chart} target="_blank" rel="noreferrer">Chart</a>}
          <a className="hover:text-ink" href={config.links.github} target="_blank" rel="noreferrer">GitHub</a>
        </div>

        <p className="max-w-xl text-xs leading-relaxed text-ink-3">
          $SOL (the Robinhood one) is a meme coin with a 5% swap fee, redistributed as described above. It is not
          affiliated with Solana Labs, Binance, or Robinhood. It has no utility, no roadmap, and no shame. Nothing here
          is financial advice. You can lose everything. That's part of the tek too.
        </p>

        <p className="font-marker rotate-[0.5deg] text-sm text-drank" style={{ textShadow: '0 0 10px rgba(168,85,247,.6)' }}>
          thats build different (mentally) · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
