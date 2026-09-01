import { useEffect, useState } from 'react'
import { config } from '../config'
import { EMPTY_STATS, type Stats } from '../types'

/** Polls the keeper-published stats.json. Falls back to EMPTY_STATS pre-launch. */
export function useStats(): { stats: Stats; loaded: boolean } {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true

    async function pull() {
      try {
        const res = await fetch(config.statsUrl, { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as Stats
        if (alive) {
          setStats({ ...EMPTY_STATS, ...data })
          setLoaded(true)
        }
      } catch {
        /* keeper not publishing yet — keep zeros */
      }
    }

    pull()
    const id = setInterval(pull, config.statsPollMs)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return { stats, loaded }
}
