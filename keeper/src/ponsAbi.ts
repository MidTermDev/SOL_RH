/**
 * PONS V2 ABIs — from Blockscout-verified source, cross-checked 2026-09-01
 * (see docs/PONS.md). Dependency-free so launch.ts can run pre-configuration.
 */

export const factoryAbi = [
  {
    type: 'function',
    name: 'launchToken',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'logo', type: 'string' },
          { name: 'description', type: 'string' },
          {
            name: 'socials',
            type: 'tuple',
            components: [
              { name: 'twitter', type: 'string' },
              { name: 'telegram', type: 'string' },
              { name: 'discord', type: 'string' },
              { name: 'website', type: 'string' },
              { name: 'farcaster', type: 'string' },
            ],
          },
          { name: 'creatorFeeRecipient', type: 'address' },
          { name: 'creatorTaxBps', type: 'uint16' },
          { name: 'buybackEnabled', type: 'bool' },
          { name: 'expectedEconomics', type: 'bytes32' },
          { name: 'salt', type: 'bytes32' },
        ],
      },
      { name: 'launchConfigId', type: 'uint256' },
      { name: 'pairToken', type: 'address' },
    ],
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'curve', type: 'address' },
    ],
  },
  {
    type: 'function',
    name: 'previewLaunchEconomics',
    stateMutability: 'view',
    inputs: [
      { name: 'launchConfigId', type: 'uint256' },
      { name: 'pairToken', type: 'address' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  { type: 'function', name: 'launchFee', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  {
    type: 'function',
    name: 'canLaunch',
    stateMutability: 'view',
    inputs: [{ name: 'launcher', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getLaunchedToken',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'token', type: 'address' },
          { name: 'curve', type: 'address' },
          { name: 'deployer', type: 'address' },
          { name: 'creatorFeeRecipient', type: 'address' },
          { name: 'pairToken', type: 'address' },
          { name: 'graduationThreshold', type: 'uint256' },
          { name: 'poolFee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'creatorTaxBps', type: 'uint16' },
          { name: 'buybackEnabled', type: 'bool' },
          { name: 'phase', type: 'uint8' },
          { name: 'sweptQuote', type: 'uint256' },
          { name: 'sweptTokens', type: 'uint256' },
          { name: 'sweptAt', type: 'uint256' },
          { name: 'exists', type: 'bool' },
        ],
      },
    ],
  },
] as const

export const curveAbi = [
  {
    type: 'function',
    name: 'sweepFees',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'minBuybackTokensOut', type: 'uint256' }],
    outputs: [],
  },
  { type: 'function', name: 'quoteFeeBalance', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'creatorTaxBalance', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'graduated', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
] as const

export const hookAbi = [
  {
    type: 'function',
    name: 'sweepPoolFees',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'poolId', type: 'bytes32' },
      { name: 'minConversionQuoteOut', type: 'uint256' },
      { name: 'minBuybackTokensOut', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'pendingFees',
    stateMutability: 'view',
    inputs: [
      { name: 'poolId', type: 'bytes32' },
      { name: 'currency', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'pendingCreatorTax',
    stateMutability: 'view',
    inputs: [
      { name: 'poolId', type: 'bytes32' },
      { name: 'currency', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const

export const escrowAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'recipient', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  { type: 'function', name: 'claim', stateMutability: 'nonpayable', inputs: [], outputs: [{ type: 'uint256' }] },
] as const

