export interface TokenData {
  id: string;
  symbol: string;
  name: string;
  category: string;
  color: string;
}

export const TOKENS: TokenData[] = [
  // Layer 1
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', category: 'Layer 1', color: '#F7931A' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', category: 'Layer 1', color: '#627EEA' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', category: 'Layer 1', color: '#9945FF' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', category: 'Layer 1', color: '#0033AD' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', category: 'Layer 1', color: '#E84142' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', category: 'Layer 1', color: '#E6007A' },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', category: 'Layer 1', color: '#00C08B' },
  { id: 'tron', symbol: 'TRX', name: 'TRON', category: 'Layer 1', color: '#FF0013' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos', category: 'Layer 1', color: '#6F7390' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar', category: 'Layer 1', color: '#14B6E7' },
  { id: 'algorand', symbol: 'ALGO', name: 'Algorand', category: 'Layer 1', color: '#6DC6E7' },
  { id: 'aptos', symbol: 'APT', name: 'Aptos', category: 'Layer 1', color: '#00BFA5' },
  { id: 'sui', symbol: 'SUI', name: 'Sui', category: 'Layer 1', color: '#4DA2FF' },
  { id: 'fantom', symbol: 'FTM', name: 'Fantom', category: 'Layer 1', color: '#1969FF' },
  { id: 'hedera-hashgraph', symbol: 'HBAR', name: 'Hedera', category: 'Layer 1', color: '#8259EF' },
  { id: 'vechain', symbol: 'VET', name: 'VeChain', category: 'Layer 1', color: '#15BDFF' },
  { id: 'internet-computer', symbol: 'ICP', name: 'Internet Computer', category: 'Layer 1', color: '#29ABE2' },
  { id: 'tezos', symbol: 'XTZ', name: 'Tezos', category: 'Layer 1', color: '#2C7DF7' },

  // DeFi
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', category: 'DeFi', color: '#FF007A' },
  { id: 'aave', symbol: 'AAVE', name: 'Aave', category: 'DeFi', color: '#B6509E' },
  { id: 'curve-dao-token', symbol: 'CRV', name: 'Curve', category: 'DeFi', color: '#FFED00' },
  { id: 'maker', symbol: 'MKR', name: 'Maker', category: 'DeFi', color: '#1AAB9B' },
  { id: 'sushiswap', symbol: 'SUSHI', name: 'SushiSwap', category: 'DeFi', color: '#FA52A0' },
  { id: 'compound-governance-token', symbol: 'COMP', name: 'Compound', category: 'DeFi', color: '#00D395' },
  { id: '1inch', symbol: '1INCH', name: '1inch', category: 'DeFi', color: '#94A6C3' },
  { id: 'pancakeswap-token', symbol: 'CAKE', name: 'PancakeSwap', category: 'DeFi', color: '#D1884F' },
  { id: 'lido-dao', symbol: 'LDO', name: 'Lido DAO', category: 'DeFi', color: '#00A3FF' },
  { id: 'balancer', symbol: 'BAL', name: 'Balancer', category: 'DeFi', color: '#5B7BF0' },
  { id: 'synthetix-network-token', symbol: 'SNX', name: 'Synthetix', category: 'DeFi', color: '#00D1FF' },
  { id: 'convex-finance', symbol: 'CVX', name: 'Convex', category: 'DeFi', color: '#3A82F7' },

  // Memecoins
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', category: 'Memecoins', color: '#C2A633' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', category: 'Memecoins', color: '#FFA409' },
  { id: 'floki', symbol: 'FLOKI', name: 'Floki', category: 'Memecoins', color: '#F5A623' },
  { id: 'bonk', symbol: 'BONK', name: 'Bonk', category: 'Memecoins', color: '#F19E39' },
  { id: 'dogwifcoin', symbol: 'WIF', name: 'dogwifhat', category: 'Memecoins', color: '#E8B530' },

  // Gaming
  { id: 'axie-infinity', symbol: 'AXS', name: 'Axie Infinity', category: 'Gaming', color: '#0055D5' },
  { id: 'the-sandbox', symbol: 'SAND', name: 'The Sandbox', category: 'Gaming', color: '#04ADEF' },
  { id: 'decentraland', symbol: 'MANA', name: 'Decentraland', category: 'Gaming', color: '#FF2D55' },
  { id: 'gala', symbol: 'GALA', name: 'Gala', category: 'Gaming', color: '#45B5AA' },
  { id: 'enjincoin', symbol: 'ENJ', name: 'Enjin Coin', category: 'Gaming', color: '#624DBF' },
  { id: 'illuvium', symbol: 'ILV', name: 'Illuvium', category: 'Gaming', color: '#A855F7' },
  { id: 'immutable-x', symbol: 'IMX', name: 'Immutable', category: 'Gaming', color: '#0196FF' },
  { id: 'stepn', symbol: 'GMT', name: 'STEPN', category: 'Gaming', color: '#B8E986' },

  // Stablecoins
  { id: 'tether', symbol: 'USDT', name: 'Tether', category: 'Stablecoins', color: '#26A17B' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', category: 'Stablecoins', color: '#2775CA' },
  { id: 'dai', symbol: 'DAI', name: 'Dai', category: 'Stablecoins', color: '#F5AC37' },
  { id: 'true-usd', symbol: 'TUSD', name: 'TrueUSD', category: 'Stablecoins', color: '#2B2E7F' },
  { id: 'frax', symbol: 'FRAX', name: 'Frax', category: 'Stablecoins', color: '#5C8DE8' },

  // Infrastructure
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', category: 'Infrastructure', color: '#2A5ADA' },
  { id: 'the-graph', symbol: 'GRT', name: 'The Graph', category: 'Infrastructure', color: '#6747ED' },
  { id: 'filecoin', symbol: 'FIL', name: 'Filecoin', category: 'Infrastructure', color: '#0090FF' },
  { id: 'theta-token', symbol: 'THETA', name: 'Theta', category: 'Infrastructure', color: '#2AB8E6' },
  { id: 'render-token', symbol: 'RNDR', name: 'Render', category: 'Infrastructure', color: '#E14EE9' },
  { id: 'arweave', symbol: 'AR', name: 'Arweave', category: 'Infrastructure', color: '#5B8DB8' },
  { id: 'akash-network', symbol: 'AKT', name: 'Akash', category: 'Infrastructure', color: '#FF414C' },
  { id: 'ocean-protocol', symbol: 'OCEAN', name: 'Ocean', category: 'Infrastructure', color: '#5298E0' },
  { id: 'quant-network', symbol: 'QNT', name: 'Quant', category: 'Infrastructure', color: '#EC5B2A' },
  { id: 'thorchain', symbol: 'RUNE', name: 'THORChain', category: 'Infrastructure', color: '#33FF99' },
  { id: 'fetch-ai', symbol: 'FET', name: 'Fetch.ai', category: 'Infrastructure', color: '#5A60E6' },
  { id: 'injective-protocol', symbol: 'INJ', name: 'Injective', category: 'Infrastructure', color: '#0082FF' },

  // Exchange Tokens
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', category: 'Exchange', color: '#F3BA2F' },
  { id: 'crypto-com-chain', symbol: 'CRO', name: 'Cronos', category: 'Exchange', color: '#103F68' },
  { id: 'okb', symbol: 'OKB', name: 'OKB', category: 'Exchange', color: '#2D60E0' },
  { id: 'kucoin-shares', symbol: 'KCS', name: 'KuCoin', category: 'Exchange', color: '#23AF91' },
  { id: 'leo-token', symbol: 'LEO', name: 'LEO Token', category: 'Exchange', color: '#EF5C32' },

  // Layer 2
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', category: 'Layer 2', color: '#12AAFF' },
  { id: 'optimism', symbol: 'OP', name: 'Optimism', category: 'Layer 2', color: '#FF0420' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', category: 'Layer 2', color: '#8247E5' },
  { id: 'mantle', symbol: 'MNT', name: 'Mantle', category: 'Layer 2', color: '#65B3AE' },
  { id: 'starknet', symbol: 'STRK', name: 'Starknet', category: 'Layer 2', color: '#EC796B' },
  { id: 'metis-token', symbol: 'METIS', name: 'Metis', category: 'Layer 2', color: '#00CFFF' },

  // Other
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', category: 'Other', color: '#BFBBBB' },
  { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash', category: 'Other', color: '#8DC351' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', category: 'Other', color: '#4A90D9' },
  { id: 'the-open-network', symbol: 'TON', name: 'Toncoin', category: 'Other', color: '#0098EA' },
  { id: 'monero', symbol: 'XMR', name: 'Monero', category: 'Other', color: '#FF6600' },
  { id: 'celestia', symbol: 'TIA', name: 'Celestia', category: 'Other', color: '#7B2BF9' },
  // Layer 1 (More)
  { id: 'sei-network', symbol: 'SEI', name: 'Sei', category: 'Layer 1', color: '#FF3B3B' },
  { id: 'zetachain', symbol: 'ZETA', name: 'ZetaChain', category: 'Layer 1', color: '#00D199' },
  { id: 'dymension', symbol: 'DYM', name: 'Dymension', category: 'Layer 1', color: '#212121' },
  { id: 'eos', symbol: 'EOS', name: 'EOS', category: 'Layer 1', color: '#000000' },
  { id: 'flow', symbol: 'FLOW', name: 'Flow', category: 'Layer 1', color: '#00EF8B' },
  { id: 'mina-protocol', symbol: 'MINA', name: 'Mina', category: 'Layer 1', color: '#FF7300' },

  // AI
  { id: 'bittensor', symbol: 'TAO', name: 'Bittensor', category: 'AI', color: '#7452FF' },
  { id: 'render-token', symbol: 'RENDER', name: 'Render', category: 'AI', color: '#E14EE9' },
  { id: 'fetch-ai', symbol: 'ASI', name: 'Artificial Superintelligence', category: 'AI', color: '#5A60E6' },
  { id: 'worldcoin-org', symbol: 'WLD', name: 'Worldcoin', category: 'AI', color: '#000000' },
  { id: 'arkham', symbol: 'ARKM', name: 'Arkham', category: 'AI', color: '#FFFFFF' },
  { id: 'nosana', symbol: 'NOS', name: 'Nosana', category: 'AI', color: '#BD282D' },
  { id: 'paal-ai', symbol: 'PAAL', name: 'PAAL AI', category: 'AI', color: '#4ADE80' },
  { id: 'zero1-labs', symbol: 'DEAI', name: 'Zero1 Labs', category: 'AI', color: '#020617' },
  { id: 'ionet', symbol: 'IO', name: 'io.net', category: 'AI', color: '#000000' },

  // Layer 2 / Scaling (More)
  { id: 'zksync-era', symbol: 'ZK', name: 'ZKsync', category: 'Layer 2', color: '#1E69FF' },
  { id: 'linea', symbol: 'LINEA', name: 'Linea', category: 'Layer 2', color: '#121212' },
  { id: 'scroll', symbol: 'SCROLL', name: 'Scroll', category: 'Layer 2', color: '#FFD700' },
  { id: 'taiko', symbol: 'TAIKO', name: 'Taiko', category: 'Layer 2', color: '#E81899' },
  { id: 'manta-network', symbol: 'MANTA', name: 'Manta Network', category: 'Layer 2', color: '#00D1FF' },
  { id: 'blast', symbol: 'BLAST', name: 'Blast', category: 'Layer 2', color: '#FCFC03' },
  { id: 'mode', symbol: 'MODE', name: 'Mode', category: 'Layer 2', color: '#DFFE00' },

  // DeFi (More)
  { id: 'jupiter-exchange-solana', symbol: 'JUP', name: 'Jupiter', category: 'DeFi', color: '#14F195' },
  { id: 'pyth-network', symbol: 'PYTH', name: 'Pyth Network', category: 'DeFi', color: '#E6DAFF' },
  { id: 'raydium', symbol: 'RAY', name: 'Raydium', category: 'DeFi', color: '#39D353' },
  { id: 'kamino', symbol: 'KMNO', name: 'Kamino', category: 'DeFi', color: '#3C82F6' },
  { id: 'pendle', symbol: 'PENDLE', name: 'Pendle', category: 'DeFi', color: '#1A1C20' },
  { id: 'ethena', symbol: 'ENA', name: 'Ethena', category: 'DeFi', color: '#000000' },
  { id: 'jito-governance-token', symbol: 'JTO', name: 'Jito', category: 'DeFi', color: '#FFFFFF' },

  // Memecoins (More)
  { id: 'popcat', symbol: 'POPCAT', name: 'Popcat', category: 'Memecoins', color: '#F1D4B3' },
  { id: 'mew', symbol: 'MEW', name: 'cat in a dogs world', category: 'Memecoins', color: '#E395E3' },
  { id: 'coq-inu', symbol: 'COQ', name: 'Coq Inu', category: 'Memecoins', color: '#FF4E4E' },
  { id: 'wen', symbol: 'WEN', name: 'Wen', category: 'Memecoins', color: '#00D1FF' },
  { id: 'dogs', symbol: 'DOGS', name: 'Dogs', category: 'Memecoins', color: '#000000' },
  { id: 'turbos-finance', symbol: 'TURBOS', name: 'Turbos', category: 'Memecoins', color: '#00D1FF' },

  // Gaming (More)
  { id: 'ronin', symbol: 'RON', name: 'Ronin', category: 'Gaming', color: '#1273EA' },
  { id: 'beam', symbol: 'BEAM', name: 'Beam', category: 'Gaming', color: '#121212' },
  { id: 'pixels', symbol: 'PIXEL', name: 'Pixels', category: 'Gaming', color: '#7E22CE' },
  { id: 'portal', symbol: 'PORTAL', name: 'Portal', category: 'Gaming', color: '#000000' },
  { id: 'xai', symbol: 'XAI', name: 'Xai', category: 'Gaming', color: '#FF0000' },
  { id: 'prime', symbol: 'PRIME', name: 'Echelon Prime', category: 'Gaming', color: '#FFFFFF' },

  // Privacy
  { id: 'oasis-network', symbol: 'ROSE', name: 'Oasis', category: 'Privacy', color: '#31C1BF' },
  { id: 'secret', symbol: 'SCRT', name: 'Secret', category: 'Privacy', color: '#000000' },
  { id: 'zcash', symbol: 'ZEC', name: 'Zcash', category: 'Privacy', color: '#F4B728' },

  // Others
  { id: 'eigenlayer', symbol: 'EIGEN', name: 'EigenLayer', category: 'Infrastructure', color: '#000000' },
  { id: 'ether-fi', symbol: 'ETHFI', name: 'ether.fi', category: 'DeFi', color: '#5C8DE8' },
  { id: 'renzo', symbol: 'REZ', name: 'Renzo', category: 'DeFi', color: '#FFFFFF' },
  { id: 'degen-base', symbol: 'DEGEN', name: 'Degen', category: 'Layer 2', color: '#8A63D2' },
];
