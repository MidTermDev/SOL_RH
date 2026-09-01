import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { parseAbiItem, type Address } from 'viem'
import { cfg, DEAD_ADDRESSES } from './config.ts'
import { rhPublic, bscPublic } from './chains.ts'
import { log } from './log.ts'

const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')

const HOLDERS_PATH = new URL('../data/holders.json', import.meta.url).pathname
const EOA_CACHE_PATH = new URL('../data/eoa-cache.json', import.meta.url).pathname

interface HolderState {
  lastBlock: string
  balances: Record<string, string>
}

function load(): HolderState {
  if (!existsSync(HOLDERS_PATH)) return { lastBlock: (cfg.launchBlock - 1n).toString(), balances: {} }
  return JSON.parse(readFileSync(HOLDERS_PATH, 'utf8')) as HolderState
}

function save(state: HolderState): void {
  mkdirSync(dirname(HOLDERS_PATH), { recursive: true })
  writeFileSync(HOLDERS_PATH, JSON.stringify(state, null, 2))
}

/**
 * Incrementally index $SOL Transfer events on Robinhood Chain and return the
 * full balance map. Self-contained — no third-party indexer required.
 */
export async function syncHolders(): Promise<Map<Address, bigint>> {
  const state = load()
  const balances = new Map<Address, bigint>(
    Object.entries(state.balances).map(([a, v]) => [a as Address, BigInt(v)]),
  )

  const latest = await rhPublic.getBlockNumber()
  let from = BigInt(state.lastBlock) + 1n

  while (from <= latest) {
    const to = from + cfg.logsChunkSize - 1n > latest ? latest : from + cfg.logsChunkSize - 1n
    const logs = await rhPublic.getLogs({
      address: cfg.token,
      event: transferEvent,
      fromBlock: from,
      toBlock: to,
    })
    for (const l of logs) {
      const { from: src, to: dst, value } = l.args as { from: Address; to: Address; value: bigint }
      if (value === 0n) continue
      balances.set(src, (balances.get(src) ?? 0n) - value)
      balances.set(dst, (balances.get(dst) ?? 0n) + value)
    }
    if (logs.length > 0) log(`indexed ${logs.length} transfers in blocks ${from}–${to}`)
    from = to + 1n
  }

  // prune zero/negative (mint origin goes negative) balances
  for (const [addr, bal] of balances) {
    if (bal <= 0n) balances.delete(addr)
  }

  save({
    lastBlock: latest.toString(),
    balances: Object.fromEntries([...balances].map(([a, v]) => [a, v.toString()])),
  })

  return balances
}

// ── EOA screening ─────────────────────────────────────────────────────────────
// Native BNB is paid on a DIFFERENT chain than the one holders bought on, so we
// only ever pay addresses with no code on BOTH chains: an EOA is controlled by
// the same key everywhere, a contract is not. Verdicts are cached; "contract"
// is permanent, "eoa" is rechecked periodically (an EOA can become a contract
// wallet via EIP-7702 delegation or deployment, never the reverse).

interface EoaCache {
  [addr: string]: { verdict: 'eoa' | 'contract'; checkedAt: number }
}

const EOA_RECHECK_MS = 7 * 24 * 3600 * 1000

function loadEoaCache(): EoaCache {
  if (!existsSync(EOA_CACHE_PATH)) return {}
  return JSON.parse(readFileSync(EOA_CACHE_PATH, 'utf8')) as EoaCache
}

export async function screenEoas(addrs: Address[]): Promise<Set<Address>> {
  const cache = loadEoaCache()
  const now = Date.now()
  const eoas = new Set<Address>()

  for (const addr of addrs) {
    const hit = cache[addr]
    if (hit && (hit.verdict === 'contract' || now - hit.checkedAt < EOA_RECHECK_MS)) {
      if (hit.verdict === 'eoa') eoas.add(addr)
      continue
    }
    const [rhCode, bscCode] = await Promise.all([
      rhPublic.getCode({ address: addr }),
      bscPublic.getCode({ address: addr }),
    ])
    const isEoa = (!rhCode || rhCode === '0x') && (!bscCode || bscCode === '0x')
    cache[addr] = { verdict: isEoa ? 'eoa' : 'contract', checkedAt: now }
    if (isEoa) eoas.add(addr)
  }

  mkdirSync(dirname(EOA_CACHE_PATH), { recursive: true })
  writeFileSync(EOA_CACHE_PATH, JSON.stringify(cache, null, 2))
  return eoas
}

export function isExcluded(addr: Address, extra: Address[]): boolean {
  const lower = addr.toLowerCase()
  return [...DEAD_ADDRESSES, ...cfg.excluded, ...extra].some((e) => e.toLowerCase() === lower)
}
