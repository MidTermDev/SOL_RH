import { bscPublic, rhPublic, rhWallet } from './chains.ts'
import { account } from './chains.ts'
import { cfg } from './config.ts'
import { log } from './log.ts'

/**
 * Bridge native ETH (Robinhood Chain, id 4663) → native BNB (BNB Chain, id 56)
 * via LI.FI — one of the aggregators Robinhood's own bridging docs point to.
 * Route verified live 2026-09-01 (Symbiosis, ~43s). Native→native, so no
 * approvals are involved; the quote's transactionRequest carries the value.
 */

const LIFI = 'https://li.quest/v1'
const NATIVE = '0x0000000000000000000000000000000000000000'

interface LifiQuote {
  estimate: { toAmountMin: string }
  transactionRequest: { to: `0x${string}`; data: `0x${string}`; value: string; gasLimit?: string }
  tool: string
}

async function getQuote(amountWei: bigint): Promise<LifiQuote> {
  const params = new URLSearchParams({
    fromChain: '4663',
    toChain: '56',
    fromToken: NATIVE,
    toToken: NATIVE,
    fromAmount: amountWei.toString(),
    fromAddress: account.address,
    toAddress: account.address,
    slippage: cfg.bridgeSlippage,
  })
  const res = await fetch(`${LIFI}/quote?${params}`)
  if (!res.ok) throw new Error(`LI.FI quote failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as LifiQuote
}

/**
 * Wait for the BNB to actually land, trusting the destination-chain balance
 * over LI.FI's status API (which has been seen reporting PENDING/UNKNOWN_ERROR
 * long after the funds arrived). Status is only consulted for hard failures.
 */
async function waitForArrival(txHash: `0x${string}`, bnbBefore: bigint): Promise<bigint> {
  const deadline = Date.now() + 30 * 60 * 1000
  while (Date.now() < deadline) {
    const bal = await bscPublic.getBalance({ address: account.address })
    if (bal > bnbBefore) return bal - bnbBefore

    try {
      const res = await fetch(`${LIFI}/status?txHash=${txHash}`)
      if (res.ok) {
        const s = (await res.json()) as { status: string; substatus?: string }
        log(`bridge status: ${s.status}${s.substatus ? ` (${s.substatus})` : ''}`)
        if (s.status === 'FAILED') throw new Error(`bridge FAILED for ${txHash}`)
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('bridge FAILED')) throw err
      // status API flake — the balance check above is the real signal
    }
    await new Promise((r) => setTimeout(r, 15_000))
  }
  throw new Error(`bridge timed out for ${txHash}`)
}

/** @returns BNB received on BNB Chain (wei), measured as the real balance delta */
export async function bridgeEthToBnb(amountWei: bigint): Promise<bigint> {
  const bnbBefore = await bscPublic.getBalance({ address: account.address })
  const quote = await getQuote(amountWei)
  log(`bridging ${amountWei} ETH-wei → BNB via ${quote.tool}, min out ${quote.estimate.toAmountMin}`)

  const tr = quote.transactionRequest
  const txHash = await rhWallet.sendTransaction({
    to: tr.to,
    data: tr.data,
    value: BigInt(tr.value),
    gas: tr.gasLimit ? BigInt(tr.gasLimit) : undefined,
  })
  const receipt = await rhPublic.waitForTransactionReceipt({ hash: txHash })
  if (receipt.status !== 'success') throw new Error(`bridge tx reverted: ${txHash}`)
  log(`bridge tx sent on Robinhood Chain: ${txHash}`)

  const received = await waitForArrival(txHash, bnbBefore)
  log(`received ${received} BNB-wei on BNB Chain`)
  return received
}
