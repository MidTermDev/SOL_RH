import type { Address } from 'viem'
import { batchDistributorAbi } from './abi.ts'
import { account, bscPublic, bscWallet } from './chains.ts'
import { cfg } from './config.ts'
import { isExcluded, screenEoas } from './holders.ts'
import { log } from './log.ts'

export interface DistributionResult {
  bnbDistributed: bigint
  holdersPaid: number
  txHashes: `0x${string}`[]
}

/**
 * Split `bnbWei` pro-rata across eligible holders and send it in batches via
 * BatchDistributor on BNB Chain. Dust shares below the per-holder floor stay in
 * the keeper wallet and roll into the next round automatically (the next run
 * distributes from the wallet's whole BNB balance minus a gas reserve).
 */
export async function distributeBnb(
  balances: Map<Address, bigint>,
  bnbWei: bigint,
  extraExclusions: Address[],
): Promise<DistributionResult> {
  // eligibility: not excluded, above min token balance, EOA on both chains
  const candidates = [...balances.entries()].filter(
    ([addr, bal]) => bal >= cfg.minTokenBalance && !isExcluded(addr, extraExclusions),
  )
  const eoas = await screenEoas(candidates.map(([a]) => a))
  const eligible = candidates.filter(([a]) => eoas.has(a))
  const totalEligible = eligible.reduce((acc, [, b]) => acc + b, 0n)
  if (totalEligible === 0n || bnbWei === 0n) {
    log('nothing to distribute (no eligible holders or zero BNB)')
    return { bnbDistributed: 0n, holdersPaid: 0, txHashes: [] }
  }

  const payouts: [Address, bigint][] = []
  for (const [addr, bal] of eligible) {
    const share = (bnbWei * bal) / totalEligible
    if (share >= cfg.minBnbPerHolder) payouts.push([addr, share])
  }
  log(`distributing to ${payouts.length}/${eligible.length} holders (rest under dust floor)`)

  const txHashes: `0x${string}`[] = []
  let sent = 0n
  let paid = 0

  for (let i = 0; i < payouts.length; i += cfg.batchSize) {
    const batch = payouts.slice(i, i + cfg.batchSize)
    const to = batch.map(([a]) => a)
    const amounts = batch.map(([, v]) => v)
    const value = amounts.reduce((a, b) => a + b, 0n)

    const hash = await bscWallet.writeContract({
      address: cfg.distributor,
      abi: batchDistributorAbi,
      functionName: 'distributeNative',
      args: [to, amounts],
      value,
    })
    const receipt = await bscPublic.waitForTransactionReceipt({ hash })
    if (receipt.status !== 'success') throw new Error(`distribution batch reverted: ${hash}`)

    txHashes.push(hash)
    sent += value
    paid += batch.length
    log(`batch ${Math.floor(i / cfg.batchSize) + 1}: paid ${batch.length} holders, tx ${hash}`)
  }

  return { bnbDistributed: sent, holdersPaid: paid, txHashes }
}

/** BNB available to pay out: wallet balance minus a gas reserve for future batches */
export async function availableBnb(): Promise<bigint> {
  const gasReserve = 3n * 10n ** 15n // 0.003 BNB
  const bal = await bscPublic.getBalance({ address: account.address })
  return bal > gasReserve ? bal - gasReserve : 0n
}
