import { useState } from 'react'
import { config } from '../config'

const links = [
  { label: 'Stats', href: '#stats' },
  { label: 'The Tek', href: '#tek' },
  { label: 'FAQ', href: '#faq' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="flex w-full max-w-2xl items-center justify-between rounded-full border border-line bg-card/70 py-2 pl-4 pr-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <a href="#top" className="flex items-center gap-2.5">
          <img src="./sol.svg" alt="" className="h-8 w-8 rounded-xl" />
          <span className="font-display text-lg font-bold tracking-tight">
            SOL<span className="text-ink-3">·on·</span>
            <span className="text-hood">HOOD</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-2 transition hover:bg-white/5 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          <a
            href={config.ponsUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-1 rounded-full bg-sol-green px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
          >
            Buy $SOL
          </a>
        </div>

        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full p-2.5 text-ink-2 hover:bg-white/5 sm:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="absolute top-16 w-full max-w-2xl rounded-3xl border border-line bg-card/95 p-2 shadow-2xl backdrop-blur-xl sm:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-ink-2 hover:bg-white/5 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          <a
            href={config.ponsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block rounded-2xl bg-sol-green px-4 py-3 text-center text-sm font-semibold text-black"
          >
            Buy $SOL
          </a>
        </div>
      )}
    </header>
  )
}
