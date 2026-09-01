import { zeroAddress } from 'viem'
import { account, rhPublic, rhWallet } from './chains.ts'
import { cfg } from './config.ts'
import { log, logErr } from './log.ts'
import { curveAbi, derivePoolId, escrowAbi, getLaunchInfo, hookAbi } from './pons.ts'

/**
 * PONS V2 fee lifecycle (verified — docs/PONS.md):
 *   1. fees accrue on the bonding curve pre-graduation, on the v4 hook after
 *   2. a sweep call splits them (base fee 70/30 creator/protocol, creator tax
 *      100% creator) and credits the V2FeeEscrow in native ETH
 *   3. claim() on the escrow pays the keeper
 * Sweeps are best-effort: the keeper (as deployer/creator) can't sweep when an
 * internal swap is required — PONS's own feeSweepOperator automation handles
 * those — and whatever is already escrowed still gets claimed below.
 */

async function trySweep(label: string, fn: () => Promise<`0x${string}`>): Promise<void> {
  try {
    const hash = await fn()
    const receipt = await rhPublic.waitForTransactionReceipt({ hash })
    log(`${label}: ${receipt.status} (tx ${hash})`)
  } catch (err) {
    const msg = err instanceof Error ? err.message.replace(/\s+/g, ' ').slice(0, 220) : String(err)
    logErr(`${label} skipped`, msg)
  }
}

/** Sweep accrued fees into the escrow, then claim. @returns native ETH claimed (wei). */
export async function claimFees(): Promise<bigint> {
  const info = await getLaunchInfo()
  const graduated = await rhPublic.readContract({
    address: info.curve,
    abi: curveAbi,
    functionName: 'graduated',
  })

  if (!graduated) {
    const [quoteFees, creatorTax] = await Promise.all([
      rhPublic.readContract({ address: info.curve, abi: curveAbi, functionName: 'quoteFeeBalance' }),
      rhPublic.readContract({ address: info.curve, abi: curveAbi, functionName: 'creatorTaxBalance' }),
    ])
    if (quoteFees + creatorTax > 0n) {
      await trySweep('curve sweep', () =>
        rhWallet.writeContract({ address: info.curve, abi: curveAbi, functionName: 'sweepFees', args: [0n] }),
      )
    }
  } else {
    const poolId = derivePoolId(info)
    const quote = info.pairToken // zero address for native-ETH launches
    const [pendingFees, pendingTax] = await Promise.all([
      rhPublic.readContract({ address: cfg.ponsHook, abi: hookAbi, functionName: 'pendingFees', args: [poolId, quote] }),
      rhPublic.readContract({ address: cfg.ponsHook, abi: hookAbi, functionName: 'pendingCreatorTax', args: [poolId, quote] }),
    ])
    if (pendingFees + pendingTax > 0n) {
      await trySweep('hook sweep', () =>
        rhWallet.writeContract({
          address: cfg.ponsHook,
          abi: hookAbi,
          functionName: 'sweepPoolFees',
          args: [poolId, 0n, 0n],
        }),
      )
    }
  }

  const claimable = await rhPublic.readContract({
    address: cfg.ponsFeeEscrow,
    abi: escrowAbi,
    functionName: 'balanceOf',
    args: [account.address],
  })
  if (claimable === 0n) {
    log('escrow: nothing to claim')
    return 0n
  }

  const hash = await rhWallet.writeContract({
    address: cfg.ponsFeeEscrow,
    abi: escrowAbi,
    functionName: 'claim',
    args: [],
  })
  const receipt = await rhPublic.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') throw new Error(`escrow claim reverted: ${hash}`)
  log(`claimed ${claimable} wei ETH from escrow (tx ${hash})`)
  return claimable
}

/** addresses that must never receive rewards, derived from the launch itself */
export async function ponsExclusions(): Promise<`0x${string}`[]> {
  const info = await getLaunchInfo()
  const locker = '0x267444D099b10fB5Ed7c3Cc7B7c767AdcA574952' as const // V2 launch locker
  return [info.curve, cfg.ponsHook, cfg.ponsFeeEscrow, cfg.ponsFactory, locker].filter(
    (a) => a !== zeroAddress,
  )
}
