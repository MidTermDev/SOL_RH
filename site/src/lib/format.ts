/** 1234.5678 -> "1,234.57" · 0.00012 -> "0.00012" · 12900 -> "12.9K" when compact */
export function fmt(value: string | number, opts?: { compact?: boolean; maxDp?: number }): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return '—'
  if (opts?.compact && Math.abs(n) >= 10_000) {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  }
  const maxDp = opts?.maxDp ?? (Math.abs(n) >= 100 ? 2 : Math.abs(n) >= 1 ? 4 : 6)
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxDp }).format(n)
}

export function shortAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${Math.floor(s)}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

/** ms until an ISO time, clamped at 0 */
export function msUntil(iso: string): number {
  return Math.max(0, new Date(iso).getTime() - Date.now())
}

export function countdown(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}
