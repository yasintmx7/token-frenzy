// NFT Contract configuration for Board Skins
// Deploy your ERC-721 contract and replace these values

export const NFT_CONTRACT = {
  // Replace with your deployed contract address on Base
  address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  chainId: 8453, // Base mainnet
} as const;

// Minimal ERC-721 ABI for ownership checks + minting
export const NFT_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'skinId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'ownsToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'skinId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// Skin ID mapping — maps board theme IDs to on-chain token IDs
export const SKIN_TOKEN_IDS: Record<string, number> = {
  'neon-grid': 0,
  'cyber-purple': 1,
  'gold-marble': 2,
  'dark-carbon': 3,
  'ice-blue-glow': 4,
  'lava-red': 5,
};

// Mint price in ETH (on Base)
export const MINT_PRICE = '0.001';
