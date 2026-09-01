import { createPublicClient, createWalletClient, defineChain, fallback, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { bsc } from 'viem/chains'
import { cfg } from './config.ts'

// free public RPCs flake in creative ways (publicnode gates receipt lookups as
// "archive" calls) — always keep a fallback behind the configured endpoint
const rhTransport = fallback([http(cfg.rhRpcUrl), http('https://robinhood-rpc.publicnode.com')])
const bscTransport = fallback([
  http(cfg.bscRpcUrl),
  http('https://bsc-dataseed.bnbchain.org'),
  http('https://bsc-dataseed1.binance.org'),
])

/** Robinhood Chain mainnet — chain id verified on-chain (0x1237) */
export const robinhoodChain = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [cfg.rhRpcUrl] } },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://robinhoodchain.blockscout.com' },
  },
})

export const account = privateKeyToAccount(cfg.keeperPrivateKey)

export const rhPublic = createPublicClient({ chain: robinhoodChain, transport: rhTransport })
export const rhWallet = createWalletClient({ account, chain: robinhoodChain, transport: rhTransport })

export const bscPublic = createPublicClient({ chain: bsc, transport: bscTransport })
export const bscWallet = createWalletClient({ account, chain: bsc, transport: bscTransport })
