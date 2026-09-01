import { createPublicClient, createWalletClient, defineChain, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { bsc } from 'viem/chains'
import { cfg } from './config.ts'

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

export const rhPublic = createPublicClient({ chain: robinhoodChain, transport: http(cfg.rhRpcUrl) })
export const rhWallet = createWalletClient({ account, chain: robinhoodChain, transport: http(cfg.rhRpcUrl) })

export const bscPublic = createPublicClient({ chain: bsc, transport: http(cfg.bscRpcUrl) })
export const bscWallet = createWalletClient({ account, chain: bsc, transport: http(cfg.bscRpcUrl) })
