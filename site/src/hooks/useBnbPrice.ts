import { useEffect, useState } from 'react'

/** live BNB/USD from CoinGecko's free endpoint, refreshed every 60s */
export function useBnbPrice(): number | null {
  const [price, setPrice] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    async function pull() {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd')
        const j = (await res.json()) as { binancecoin?: { usd?: number } }
        if (alive && j.binancecoin?.usd) setPrice(j.binancecoin.usd)
      } catch {
        /* price is decoration — never break the dashboard over it */
      }
    }
    pull()
    const id = setInterval(pull, 60_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return price
}
