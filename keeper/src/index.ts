import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { formatEther } from 'viem'
import { account, rhPublic, rhWallet } from './chains.ts'
import { cfg } from './config.ts'
import { bridgeEthToBnb } from './bridge.ts'
import { availableBnb, distributeBnb } from './distribute.ts'
import { claimFees, ponsExclusions } from './fees.ts'
import { syncHolders } from './holders.ts'
import { log, logErr } from './log.ts'
import { addDecimal, loadStats, saveStats } from './stats.ts'

const BPS = 10_000n
const STATE_PATH = new URL('../data/state.json', import.meta.url).pathname

/** internal ledger: claimed fees not yet split, kept separate from gas money */
function loadPendingFees(): bigint {
  if (!existsSync(STATE_PATH)) return 0n
  return BigInt((JSON.parse(readFileSync(STATE_PATH, 'utf8')) as { pendingFeesWei: string }).pendingFeesWei)
}

function savePendingFees(wei: bigint): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true })
  writeFileSync(STATE_PATH, JSON.stringify({ pendingFeesWei: wei.toString() }, null, 2))
}

function currentPhase(): 'pre' | 'treasury' | 'rewards' {
  const launch = new Date(cfg.launchAt).getTime()
  const now = Date.now()
  if (now < launch) return 'pre'
  if (now < launch + cfg.treasuryPhaseMinutes * 60_000) return 'treasury'
  return 'rewards'
}

async function sendEthToTreasury(amount: bigint): Promise<void> {
  if (amount === 0n) return
  const hash = await rhWallet.sendTransaction({ to: cfg.treasury, value: amount })
  const receipt = await rhPublic.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') throw new Error(`treasury transfer reverted: ${hash}`)
  log(`sent ${formatEther(amount)} ETH to treasury (tx ${hash})`)
}

async function runOnce(): Promise<void> {
  const stats = loadStats()
  stats.launchAt = cfg.launchAt
  const phase = currentPhase()
  stats.phase = phase

  const balances = await syncHolders()
  stats.uniqueHolders = balances.size

  if (phase === 'pre') {
    log('pre-launch — heartbeat only')
    stats.nextRunAt = new Date(Date.now() + cfg.runIntervalMinutes * 60_000).toISOString()
    saveStats(stats)
    return
  }

  const claimed = await claimFees()
  let pending = loadPendingFees() + claimed
  if (claimed > 0n) stats.totalEthCollected = addDecimal(stats.totalEthCollected, claimed)

  // never dip into gas money: only fees actually claimed are spendable
  const balance = await rhPublic.getBalance({ address: account.address })
  const headroom = balance > cfg.gasReserveWei ? balance - cfg.gasReserveWei : 0n
  const spendable = pending < headroom ? pending : headroom

  log(`phase=${phase} · claimed=${formatEther(claimed)} · pending=${formatEther(pending)} · spendable=${formatEther(spendable)} ETH`)

  if (phase === 'treasury') {
    // war-chest window: everything goes to the treasury
    await sendEthToTreasury(spendable)
    stats.treasuryEth = addDecimal(stats.treasuryEth, spendable)
    pending -= spendable
  } else if (spendable >= cfg.minEthToProcess) {
    const treasuryCut = (spendable * (BPS - cfg.rewardsBps)) / BPS
    const rewardsCut = spendable - treasuryCut

    await sendEthToTreasury(treasuryCut)
    stats.treasuryEth = addDecimal(stats.treasuryEth, treasuryCut)
    pending -= treasuryCut

    await bridgeEthToBnb(rewardsCut)
    pending -= rewardsCut
  } else {
    log(`spendable ETH below floor (${formatEther(cfg.minEthToProcess)}) — accruing for next run`)
  }
  savePendingFees(pending)

  // distribute whatever BNB the wallet holds (fresh bridge output + rolled-over dust)
  if (phase === 'rewards') {
    const bnb = await availableBnb()
    if (bnb >= cfg.minBnbPerHolder) {
      const extraExclusions = [
        account.address,
        cfg.token,
        cfg.treasury,
        cfg.distributor,
        ...(await ponsExclusions()),
      ]
      const result = await distributeBnb(balances, bnb, extraExclusions)
      if (result.holdersPaid > 0) {
        const rec = {
          t: new Date().toISOString(),
          bnb: formatEther(result.bnbDistributed),
          holders: result.holdersPaid,
          txHash: result.txHashes[0],
        }
        stats.totalBnbDistributed = addDecimal(stats.totalBnbDistributed, result.bnbDistributed)
        stats.holdersPaidTotal += result.holdersPaid
        stats.distributionCount += 1
        stats.lastDistribution = rec
        stats.history.push(rec)
      }
    }
  }

  stats.nextRunAt = new Date(Date.now() + cfg.runIntervalMinutes * 60_000).toISOString()
  saveStats(stats)
  log('run complete')
}

async function main(): Promise<void> {
  log(`keeper up — wallet ${account.address}, token ${cfg.token}, launch ${cfg.launchAt}`)

  if (process.env.RUN_ONCE === 'true') {
    await runOnce()
    return
  }

  // simple resilient loop; one failed run never kills the keeper
  for (;;) {
    try {
      await runOnce()
    } catch (err) {
      logErr('run failed', err)
    }
    await new Promise((r) => setTimeout(r, cfg.runIntervalMinutes * 60_000))
  }
}

main().catch((err) => {
  logErr('fatal', err)
  process.exit(1)
})
