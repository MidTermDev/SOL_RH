import { formatEther } from 'viem'
import { erc20Abi } from './abi.ts'
import { account, rhPublic, rhWallet } from './chains.ts'
import { cfg } from './config.ts'
import { bridgeWethToBnb } from './bridge.ts'
import { availableBnb, distributeBnb } from './distribute.ts'
import { claimFees } from './fees.ts'
import { syncHolders } from './holders.ts'
import { log, logErr } from './log.ts'
import { addDecimal, loadStats, saveStats } from './stats.ts'

const BPS = 10_000n

function currentPhase(): 'pre' | 'treasury' | 'rewards' {
  const launch = new Date(cfg.launchAt).getTime()
  const now = Date.now()
  if (now < launch) return 'pre'
  if (now < launch + cfg.treasuryPhaseMinutes * 60_000) return 'treasury'
  return 'rewards'
}

async function wethBalance(): Promise<bigint> {
  return rhPublic.readContract({
    address: cfg.weth,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })
}

async function sendWethToTreasury(amount: bigint): Promise<void> {
  if (amount === 0n) return
  const hash = await rhWallet.writeContract({
    address: cfg.weth,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [cfg.treasury, amount],
  })
  const receipt = await rhPublic.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') throw new Error(`treasury transfer reverted: ${hash}`)
  log(`sent ${formatEther(amount)} WETH to treasury (tx ${hash})`)
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
  if (claimed > 0n) stats.totalWethCollected = addDecimal(stats.totalWethCollected, claimed)

  const weth = await wethBalance()
  log(`phase=${phase} · claimed=${formatEther(claimed)} WETH · wallet=${formatEther(weth)} WETH`)

  if (phase === 'treasury') {
    // war-chest window: everything goes to the treasury
    await sendWethToTreasury(weth)
    stats.treasuryWeth = addDecimal(stats.treasuryWeth, weth)
  } else if (weth >= cfg.minWethToProcess) {
    const treasuryCut = (weth * (BPS - cfg.rewardsBps)) / BPS
    const rewardsCut = weth - treasuryCut

    await sendWethToTreasury(treasuryCut)
    stats.treasuryWeth = addDecimal(stats.treasuryWeth, treasuryCut)

    await bridgeWethToBnb(rewardsCut)
  } else {
    log(`WETH below floor (${formatEther(cfg.minWethToProcess)}) — accruing for next run`)
  }

  // distribute whatever BNB the wallet holds (fresh bridge output + rolled-over dust)
  if (phase === 'rewards') {
    const bnb = await availableBnb()
    if (bnb >= cfg.minBnbPerHolder) {
      const extraExclusions = [account.address, cfg.token, cfg.treasury, cfg.distributor]
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
