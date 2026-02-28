import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createCollection, mplCore } from '@metaplex-foundation/mpl-core'
import { generateSigner, keypairIdentity, createSignerFromKeypair } from '@metaplex-foundation/umi'

/**
 * 1. PASTE YOUR RPC URL HERE
 * Example: 'https://api.devnet.solana.com' or your QuickNode/Helius URL
 */
const RPC_URL = 'https://api.devnet.solana.com';

/**
 * 2. PASTE YOUR COLLECTION METADATA URI HERE
 * You provided: bafkreihtopvnmpejrfynggyoc7hd7rutudk5vrolz5sbxclzadbqccyzku
 */
const METADATA_URI = 'https://gateway.pinata.cloud/ipfs/bafkreihtopvnmpejrfynggyoc7hd7rutudk5vrolz5sbxclzadbqccyzku';

async function createGamePassCollection() {
    // Initialize Umi
    const umi = createUmi(RPC_URL).use(mplCore());

    /**
     * 3. WALLET / SIGNER SETUP
     * Choose one of the options below and uncomment it.
     */

    // --- OPTION A: From a Secret Key Array (JSON format) ---
    /*
    const secretKey = new Uint8Array([ /* paste your secret key array here, e.g., [1,2,3...] */ ]);
    const myKeypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    const mySigner = createSignerFromKeypair(umi, myKeypair);
    */

    // --- OPTION B: Generate New (Temporary for testing) ---
    // Note: This will generate a NEW wallet every time you run it.
    const mySigner = generateSigner(umi);

    // Tell Umi to use this signer for the transaction
    umi.use(keypairIdentity(mySigner));

    console.log("------------------------------------------");
    console.log("🚀 Metaplex Core: Creating Collection...");
    console.log("Worker Wallet:", mySigner.publicKey.toString());
    console.log("------------------------------------------");

    // Generate a unique address for the collection itself
    const collectionSigner = generateSigner(umi);

    try {
        const result = await createCollection(umi, {
            collection: collectionSigner,
            name: "Game Pass Collection",
            uri: METADATA_URI,
        }).sendAndConfirm(umi);

        console.log("\n✅ SUCCESS! Collection Created.");
        console.log("------------------------------------------");
        console.log("Collection Address (SAVE THIS):", collectionSigner.publicKey.toString());
        console.log("Transaction Signature:", result.signature.toString());
        console.log("------------------------------------------");

        console.log("\nNext Step: Use the Collection Address to mint your Game Pass NFTs.");

    } catch (error) {
        console.error("\n❌ Error creating collection:");
        console.error(error);
    }
}

createGamePassCollection();
