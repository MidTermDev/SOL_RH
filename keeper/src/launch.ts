import { createPublicClient, createWalletClient, defineChain, formatEther, http, zeroAddress, zeroHash } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { factoryAbi } from './ponsAbi.ts'

/**
 * Launch $SOL on PONS V2 (bonding curve, native ETH quote, graduates to
 * Uniswap v4 at 4.2 ETH raised).
 *
 * Dry-runs by default — set CONFIRM=yes to broadcast:
 *   KEEPER_PRIVATE_KEY=0x... CONFIRM=yes node src/launch.ts
 *
 * Launch from the KEEPER wallet: the deployer is who may call sweepFees, and
 * creatorFeeRecipient is set to the same wallet so the keeper can claim().
 */

const RPC = process.env.RH_RPC_URL ?? 'https://rpc.mainnet.chain.robinhood.com'
const FACTORY = '0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e' as const

const params = {
  name: process.env.TOKEN_NAME ?? 'Solana',
  symbol: process.env.TOKEN_SYMBOL ?? 'SOL',
  logo: process.env.TOKEN_LOGO ?? 'https://midtermdev.github.io/SOL_RH/sol.svg',
  description:
    process.env.TOKEN_DESCRIPTION ??
    'Solana. The token, not the blockchain. Lives on Robinhood Chain, pays real native BNB to holders on BNB Chain. 5% creator tax: 70% airdropped back as BNB, 30% treasury. Nothing about this makes sense and that is the tek.',
  socials: {
    twitter: process.env.SOCIAL_TWITTER ?? '',
    telegram: process.env.SOCIAL_TELEGRAM ?? '',
    discord: '',
    website: process.env.SOCIAL_WEBSITE ?? 'https://midtermdev.github.io/SOL_RH/',
    farcaster: '',
  },
  creatorTaxBps: Number(process.env.CREATOR_TAX_BPS ?? '500'),
  buybackEnabled: false,
  launchConfigId: BigInt(process.env.LAUNCH_CONFIG_ID ?? '0'),
  pairToken: zeroAddress, // native ETH quote
}

async function main(): Promise<void> {
  const pk = process.env.KEEPER_PRIVATE_KEY
  if (!pk) throw new Error('KEEPER_PRIVATE_KEY required')
  const account = privateKeyToAccount(pk as `0x${string}`)

  const chain = defineChain({
    id: 4663,
    name: 'Robinhood Chain',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [RPC] } },
  })
  const pub = createPublicClient({ chain, transport: http(RPC) })
  const wallet = createWalletClient({ account, chain, transport: http(RPC) })

  const [fee, allowed, economics, balance] = await Promise.all([
    pub.readContract({ address: FACTORY, abi: factoryAbi, functionName: 'launchFee' }),
    pub.readContract({ address: FACTORY, abi: factoryAbi, functionName: 'canLaunch', args: [account.address] }),
    pub.readContract({
      address: FACTORY,
      abi: factoryAbi,
      functionName: 'previewLaunchEconomics',
      args: [params.launchConfigId, params.pairToken],
    }),
    pub.getBalance({ address: account.address }),
  ])

  console.log(`launcher:   ${account.address} (${formatEther(balance)} ETH)`)
  console.log(`launch fee: ${formatEther(fee)} ETH · canLaunch: ${allowed}`)
  console.log(`economics:  ${economics} (pinned)`)
  console.log(`token:      ${params.name} ($${params.symbol}) · creator tax ${params.creatorTaxBps} bps`)
  if (!allowed) throw new Error('factory says this wallet cannot launch right now')
  if (balance < fee) throw new Error('insufficient ETH for the launch fee')

  const tokenParams = {
    name: params.name,
    symbol: params.symbol,
    logo: params.logo,
    description: params.description,
    socials: params.socials,
    creatorFeeRecipient: account.address,
    creatorTaxBps: params.creatorTaxBps,
    buybackEnabled: params.buybackEnabled,
    expectedEconomics: economics,
    salt: (process.env.LAUNCH_SALT ?? zeroHash) as `0x${string}`,
  } as const

  const { request, result } = await pub.simulateContract({
    account,
    address: FACTORY,
    abi: factoryAbi,
    functionName: 'launchToken',
    args: [tokenParams, params.launchConfigId, params.pairToken],
    value: fee,
  })
  const [tokenAddr, curveAddr] = result
  console.log(`\nsimulation OK → token ${tokenAddr} · curve ${curveAddr}`)

  if (process.env.CONFIRM !== 'yes') {
    console.log('\nDRY RUN — set CONFIRM=yes to broadcast.')
    return
  }

  const hash = await wallet.writeContract(request)
  console.log(`launch tx: ${hash}`)
  const receipt = await pub.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') throw new Error('launch reverted')
  const block = await pub.getBlock({ blockNumber: receipt.blockNumber })
  const launchAt = new Date(Number(block.timestamp) * 1000).toISOString()

  console.log(`\n🚀 LAUNCHED in block ${receipt.blockNumber} at ${launchAt}`)
  console.log('\npaste into keeper/.env:')
  console.log(`TOKEN_ADDRESS=${tokenAddr}`)
  console.log(`LAUNCH_AT=${launchAt}`)
  console.log(`LAUNCH_BLOCK=${receipt.blockNumber}`)
  console.log(`\npaste into site/src/config.ts: tokenAddress = '${tokenAddr}'`)
  console.log(`explorer: https://robinhoodchain.blockscout.com/token/${tokenAddr}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
