import { erc20Abi } from './abi.ts'
import { account, bscPublic, rhPublic, rhWallet } from './chains.ts'
import { cfg } from './config.ts'
import { log } from './log.ts'

/**
 * Bridge WETH (Robinhood Chain, id 4663) → native BNB (BNB Chain, id 56) via
 * LI.FI — one of the aggregators Robinhood's own bridging docs point to. The
 * quote's transactionRequest handles swap+bridge in a single tx from our side.
 */

const LIFI = 'https://li.quest/v1'
const NATIVE = '0x0000000000000000000000000000000000000000'

interface LifiQuote {
  estimate: { toAmountMin: string; approvalAddress: string }
  transactionRequest: { to: `0x${string}`; data: `0x${string}`; value?: string; gasLimit?: string }
  tool: string
}

async function getQuote(amountWei: bigint): Promise<LifiQuote> {
  const params = new URLSearchParams({
    fromChain: '4663',
    toChain: '56',
    fromToken: cfg.weth,
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

async function waitForStatus(txHash: `0x${string}`): Promise<void> {
  const deadline = Date.now() + 30 * 60 * 1000
  while (Date.now() < deadline) {
    const res = await fetch(`${LIFI}/status?txHash=${txHash}`)
    if (res.ok) {
      const s = (await res.json()) as { status: string; substatus?: string }
      log(`bridge status: ${s.status}${s.substatus ? ` (${s.substatus})` : ''}`)
      if (s.status === 'DONE') return
      if (s.status === 'FAILED') throw new Error(`bridge FAILED for ${txHash}`)
    }
    await new Promise((r) => setTimeout(r, 20_000))
  }
  throw new Error(`bridge timed out for ${txHash}`)
}

/** @returns BNB received on BNB Chain (wei), measured as the real balance delta */
export async function bridgeWethToBnb(amountWei: bigint): Promise<bigint> {
  const bnbBefore = await bscPublic.getBalance({ address: account.address })
  const quote = await getQuote(amountWei)
  log(`bridging ${amountWei} WETH-wei → BNB via ${quote.tool}, min out ${quote.estimate.toAmountMin}`)

  // approve if needed
  const allowance = await rhPublic.readContract({
    address: cfg.weth,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account.address, quote.estimate.approvalAddress as `0x${string}`],
  })
  if (allowance < amountWei) {
    const approveTx = await rhWallet.writeContract({
      address: cfg.weth,
      abi: erc20Abi,
      functionName: 'approve',
      args: [quote.estimate.approvalAddress as `0x${string}`, amountWei],
    })
    await rhPublic.waitForTransactionReceipt({ hash: approveTx })
    log(`approved bridge spender: ${approveTx}`)
  }

  const tr = quote.transactionRequest
  const txHash = await rhWallet.sendTransaction({
    to: tr.to,
    data: tr.data,
    value: tr.value ? BigInt(tr.value) : 0n,
    gas: tr.gasLimit ? BigInt(tr.gasLimit) : undefined,
  })
  const receipt = await rhPublic.waitForTransactionReceipt({ hash: txHash })
  if (receipt.status !== 'success') throw new Error(`bridge tx reverted: ${txHash}`)
  log(`bridge tx sent on Robinhood Chain: ${txHash}`)

  await waitForStatus(txHash)

  // trust the chain, not the API, for the amount received
  const bnbAfter = await bscPublic.getBalance({ address: account.address })
  const received = bnbAfter - bnbBefore
  if (received <= 0n) throw new Error('bridge reported DONE but no BNB arrived')
  log(`received ${received} BNB-wei on BNB Chain`)
  return received
}
