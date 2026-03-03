export const DEFAULT_RPC_URL = "https://api.metaplex.solana.com";
export const HELIUS_RPC_URL = "https://mainnet.helius-rpc.com/?api-key=b011653b-63da-4e7b-a03f-b7d92e6dcd2a";

// Use this for Umi and Connection
// If Helius key is still the placeholder, it will use the Default RPC
export const SOLANA_RPC_URL = HELIUS_RPC_URL.includes("YOUR_HELIUS_API_KEY")
    ? DEFAULT_RPC_URL
    : HELIUS_RPC_URL;
export const SOLANA_NETWORK = "mainnet-beta";
export const METADATA_URI = "https://ipfs.io/ipfs/bafkreihtopvnmpejrfynggyoc7hd7rutudk5vrolz5sbxclzadbqccyzku";
export const ITEM_METADATA_URI = "https://ipfs.io/ipfs/bafkreihtopvnmpejrfynggyoc7hd7rutudk5vrolz5sbxclzadbqccyzku";
export const GAME_PASS_COLLECTION_ADDRESS = "AAGRLwSB3wgp6fsdTUkSvFjaNTRAS75WHxDyTJubRkSH";
export const TREASURY_WALLET = "pR7YkBj2AsRLB7sSNJEyaSnengSF3c9UUQDH1y26NBi";
export const SCORE_SUBMIT_PRICE_SOL = 0.003;
