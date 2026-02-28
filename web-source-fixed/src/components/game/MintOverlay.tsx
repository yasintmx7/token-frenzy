import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { create, mplCore, fetchCollection } from '@metaplex-foundation/mpl-core';
import { generateSigner, transactionBuilder, publicKey as umiPublicKey, sol } from '@metaplex-foundation/umi';
import { transferSol } from '@metaplex-foundation/mpl-toolbox';
import { useState } from 'react';
import { Wallet } from 'lucide-react';
import {
    SOLANA_RPC_URL,
    ITEM_METADATA_URI,
    GAME_PASS_COLLECTION_ADDRESS,
    TREASURY_WALLET
} from '@/lib/solanaConfig';

interface MintOverlayProps {
    onSuccess: () => void;
}

export const MintOverlay = ({ onSuccess }: MintOverlayProps) => {
    const { publicKey, wallet, connected, connecting } = useWallet();
    const { setVisible } = useWalletModal();
    const [status, setStatus] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleMint = async () => {
        if (!publicKey || !wallet) return;

        try {
            setIsLoading(true);
            setStatus("Preparing transaction...");

            const umi = createUmi(SOLANA_RPC_URL)
                .use(mplCore())
                .use(walletAdapterIdentity(wallet.adapter));

            const assetSigner = generateSigner(umi);
            const collectionAsset = await fetchCollection(umi, umiPublicKey(GAME_PASS_COLLECTION_ADDRESS));

            await transactionBuilder()
                .add(
                    transferSol(umi, {
                        destination: umiPublicKey(TREASURY_WALLET),
                        amount: sol(0.0025),
                    })
                )
                .add(
                    create(umi, {
                        asset: assetSigner,
                        name: "Token Frenzy Game Pass",
                        uri: ITEM_METADATA_URI,
                        collection: collectionAsset,
                        plugins: [
                            {
                                type: "PermanentFreezeDelegate",
                                frozen: true,
                                authority: { type: 'None' },
                            },
                        ],
                    })
                )
                .sendAndConfirm(umi);

            setStatus("Success! Unlocking game...");
            setTimeout(onSuccess, 1500);

        } catch (err: any) {
            console.error(err);
            setStatus(err.message?.includes("User rejected") ? "Mint cancelled" : "Error: " + (err.message || "Mint failed"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <div style={{
                maxWidth: '400px',
                padding: '2.5rem',
                backgroundColor: '#111827',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}>
                <div style={{
                    width: '120px',
                    height: '180px',
                    margin: '0 auto 1.5rem',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: '#1f2937'
                }}>
                    <img
                        src="https://gateway.pinata.cloud/ipfs/bafybeielmvw7uejrf4e3qx7zteojlkjab3jox62x22cnodbghquzbv2lva"
                        alt="Game Pass Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                    TRIAL ENDED
                </h2>
                <p style={{ color: '#9ca3af', marginBottom: '2rem', lineHeight: '1.5', fontSize: '0.9rem' }}>
                    You've enjoyed your free trial! Mint a permanent **Game Pass** to continue playing and save your progress.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    {!connected ? (
                        <button
                            onClick={() => setVisible(true)}
                            disabled={connecting}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'white',
                                color: 'black',
                                border: 'none',
                                borderRadius: '14px',
                                fontWeight: '900',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            <Wallet className="w-5 h-5" />
                            {connecting ? 'CONNECTING...' : 'CONNECT WALLET'}
                        </button>
                    ) : (
                        <button
                            onClick={handleMint}
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '14px',
                                fontWeight: '900',
                                fontSize: '1.1rem',
                                cursor: isLoading ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? "PROCESSING..." : "MINT PASS (0.0025 SOL)"}
                        </button>
                    )}
                </div>

                {status && (
                    <p style={{
                        marginTop: '1.5rem',
                        color: status.includes('Error') || status.includes('cancelled') ? '#f87171' : '#a78bfa',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                    }}>
                        {status}
                    </p>
                )}
            </div>
        </div>
    );
};
