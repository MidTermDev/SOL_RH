import { useState } from 'react'

const faqs = [
  {
    q: 'Why is it called Solana?',
    a: "Because it isn't Solana. It's an ERC-20 on Robinhood Chain. The ticker is $SOL. The confusion is the marketing budget.",
  },
  {
    q: 'Is this regarded?',
    a: 'Profoundly. It also works, which makes it worse. A keeper bot claims fees on one chain, bridges them across the void, and pays you on a different chain, on schedule, like a Swiss watch with a head injury.',
  },
  {
    q: 'Why BNB rewards?',
    a: "We surveyed which reward token would make the least sense on a Robinhood L2 and BNB won by a landslide. Also everyone secretly loves seeing BNB appear in their wallet. It's the most honest coin in crypto — it doesn't pretend to be anything except money.",
  },
  {
    q: 'Do I need to claim my rewards?',
    a: 'No. The keeper claims the fees, bridges them, and airdrops native BNB directly to your address on BNB Chain — the same address you hold $SOL with on Robinhood Chain. You do literally nothing. Holding is the whole job.',
  },
  {
    q: 'Wait — the BNB shows up on BNB Chain?',
    a: "Yes. BNB does not exist on Robinhood Chain (genuinely — the canonical bridge slot for it is empty, nobody has ever bridged one). So instead of paying you some fake wrapped IOU, the keeper bridges the rewards and pays REAL native BNB on its home chain. Your wallet address is the same on every EVM chain. One important consequence: rewards only go to normal wallets (EOAs) — if you hold from a smart-contract wallet or an exchange, you're skipped, because that address might not be yours on BNB Chain.",
  },
  {
    q: 'What stops the team from rugging the treasury?',
    a: 'The treasury address, every keeper transaction, and every airdrop are public and tracked on this very page. The 30% cut is disclosed up front. If we were going to rug we would not have built a dashboard itemizing our own wallet.',
  },
  {
    q: 'What happened in the first 10 minutes?',
    a: 'All fees went to the treasury to build a war chest for manual buybacks. That window is over (or will be, at launch). Now the 70/30 split runs forever.',
  },
  {
    q: 'Is this financial advice?',
    a: 'Brother, this is a token called Solana on the Robinhood blockchain that pays Binance coin. If you mistake anything on this page for financial advice, the market will handle the rest.',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="scroll-mt-28 px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          FAQ<span className="text-sol-purple">.</span>
        </h2>
        <p className="mt-2 text-ink-2">Frequently asked questions. Infrequently satisfying answers.</p>

        <div className="mt-8 space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border border-line bg-card">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <span className="font-display font-semibold">{f.q}</span>
                <span className={`text-ink-3 transition-transform ${open === i ? 'rotate-45' : ''}`}>＋</span>
              </button>
              {open === i && <p className="px-6 pb-5 text-sm leading-relaxed text-ink-2">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
