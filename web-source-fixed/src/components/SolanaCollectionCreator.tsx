import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { createCollection, mplCore } from '@metaplex-foundation/mpl-core';
import { generateSigner } from '@metaplex-foundation/umi';
import { useState } from 'react';
import { SOLANA_RPC_URL, METADATA_URI } from '@/lib/solanaConfig';

// ----------------------

export const SolanaCollectionCreator = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [status, setStatus] = useState("");
    const [collectionAddr, setCollectionAddr] = useState("");

    const handleCreateCollection = async () => {
        if (!wallet.publicKey) {
            alert("Please connect your wallet first!");
            return;
        }

        try {
            setStatus("Creating collection...");

            // 1. Initialize Umi with the wallet adapter
            const umi = createUmi(SOLANA_RPC_URL)
                .use(mplCore())
                .use(walletAdapterIdentity(wallet));

            // 2. Generate a signer for the collection itself
            const collectionSigner = generateSigner(umi);

            // 3. Create the collection
            // This will trigger a Phantom popup for approval
            const tx = await createCollection(umi, {
                collection: collectionSigner,
                name: "Game Pass Collection",
                uri: METADATA_URI,
            }).sendAndConfirm(umi);

            setCollectionAddr(collectionSigner.publicKey.toString());
            setStatus("Success! Collection created.");
            console.log("Transaction Signature:", tx.signature.toString());

        } catch (err: any) {
            console.error(err);
            setStatus("Error: " + (err.message || "Unknown error"));
        }
    };

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '500px',
            margin: '2rem auto',
            backgroundColor: '#1a1b23',
            borderRadius: '16px',
            color: 'white',
            fontFamily: 'sans-serif',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            textAlign: 'center'
        }}>
            <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Core Collection Creator</h1>

            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                <WalletMultiButton />
            </div>

            <button
                onClick={handleCreateCollection}
                disabled={!wallet.connected || status === "Creating collection..."}
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: wallet.connected ? '#8b5cf6' : '#4b5563',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: wallet.connected ? 'pointer' : 'not-allowed',
                    fontSize: '1rem',
                    transition: 'background 0.2s'
                }}
            >
                {status === "Creating collection..." ? "Processing..." : "Create Collection"}
            </button>

            {status && (
                <p style={{
                    marginTop: '1rem',
                    color: status.includes('Error') ? '#f87171' : '#4ade80',
                    fontSize: '0.9rem'
                }}>
                    {status}
                </p>
            )}

            {collectionAddr && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#2d2e3a',
                    borderRadius: '8px',
                    border: '1px solid #3f3f46',
                    wordBreak: 'break-all'
                }}>
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.5rem' }}>COLLECTION ADDRESS:</p>
                    <code style={{ fontSize: '0.85rem', color: '#fbbf24' }}>{collectionAddr}</code>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#60a5fa' }}>Save this for the next step!</p>
                </div>
            )}
        </div>
    );
};
