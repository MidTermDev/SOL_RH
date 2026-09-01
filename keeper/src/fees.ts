import { erc20Abi } from './abi.ts'
import { account, rhPublic, rhWallet } from './chains.ts'
import { cfg } from './config.ts'
import { log } from './log.ts'

/**
 * Claim accrued creator fees from PONS into the keeper wallet.
 * @returns WETH received (wei), measured as the wallet's real balance delta so
 *          it stays correct regardless of what the claim call itself returns.
 */
export async function claimFees(): Promise<bigint> {
  if (!cfg.ponsFeeContract) {
    log('PONS_FEE_CONTRACT not set — skipping claim (processing existing WETH balance only)')
    return 0n
  }

  const before = await rhPublic.readContract({
    address: cfg.weth,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })

  const hash = await rhWallet.writeContract({
    address: cfg.ponsFeeContract,
    abi: ponsClaimAbi,
    functionName: 'claimFees',
    args: [cfg.token],
  })
  const receipt = await rhPublic.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') throw new Error(`fee claim reverted: ${hash}`)

  const after = await rhPublic.readContract({
    address: cfg.weth,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })
  const claimed = after - before
  log(`claimed ${claimed} WETH-wei of fees (tx ${hash})`)
  return claimed
}

/** PONS creator-fee claim — see docs/PONS.md for the verified interface */
const ponsClaimAbi = [
  {
    type: 'function',
    name: 'claimFees',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
] as const
