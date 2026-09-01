import { encodeAbiParameters, keccak256, zeroAddress, type Address } from 'viem'
import { rhPublic } from './chains.ts'
import { cfg } from './config.ts'
import { factoryAbi } from './ponsAbi.ts'

export { curveAbi, escrowAbi, factoryAbi, hookAbi } from './ponsAbi.ts'

export interface LaunchInfo {
  curve: Address
  pairToken: Address
  poolFee: number
  tickSpacing: number
  exists: boolean
}

let cached: LaunchInfo | null = null

export async function getLaunchInfo(): Promise<LaunchInfo> {
  if (cached) return cached
  const l = await rhPublic.readContract({
    address: cfg.ponsFactory,
    abi: factoryAbi,
    functionName: 'getLaunchedToken',
    args: [cfg.token],
  })
  if (!l.exists) throw new Error(`token ${cfg.token} is not a PONS V2 launch`)
  cached = { curve: l.curve, pairToken: l.pairToken, poolFee: l.poolFee, tickSpacing: l.tickSpacing, exists: l.exists }
  return cached
}

/**
 * Uniswap v4 poolId, reconstructed per the PONS v2 docs:
 * keccak256(abi.encode(currency0, currency1, fee, tickSpacing, hooks))
 * with native ETH (zero address) always currency0.
 */
export function derivePoolId(info: LaunchInfo): `0x${string}` {
  const [c0, c1] =
    info.pairToken === zeroAddress || info.pairToken.toLowerCase() < cfg.token.toLowerCase()
      ? [info.pairToken, cfg.token]
      : [cfg.token, info.pairToken]
  return keccak256(
    encodeAbiParameters(
      [
        { type: 'address' },
        { type: 'address' },
        { type: 'uint24' },
        { type: 'int24' },
        { type: 'address' },
      ],
      [c0, c1, info.poolFee, info.tickSpacing, cfg.ponsHook],
    ),
  )
}
