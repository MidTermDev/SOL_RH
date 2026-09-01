export const batchDistributorAbi = [
  {
    type: 'function',
    name: 'distributeNative',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
    outputs: [],
  },
] as const
