import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import {
    create,
    mplCore,
    fetchAssetsByOwner,
    fetchCollection
} from '@metaplex-foundation/mpl-core';
import {
    generateSigner,
    transactionBuilder,
    publicKey as umiPublicKey,
    sol
} from '@metaplex-foundation/umi';
import { transferSol } from '@metaplex-foundation/mpl-toolbox';
import { useState, useEffect } from 'react';
import {
    SOLANA_RPC_URL,
    ITEM_METADATA_URI,
    GAME_PASS_COLLECTION_ADDRESS,
    TREASURY_WALLET
} from '@/lib/solanaConfig';

export const PassMinter = () => {
    const wallet = useWallet();
    const [status, setStatus] = useState("");
    const [ownedPass, setOwnedPass] = useState<string | null>(null);
    const [mintResult, setMintResult] = useState({ signature: "", address: "" });
    const [isLoading, setIsLoading] = useState(false);

    // 1. Check if the user already owns a pass from this collection
    const checkOwnership = async () => {
        if (!wallet.publicKey) return;

        try {
            const umi = createUmi(SOLANA_RPC_URL).use(mplCore());
            const assets = await fetchAssetsByOwner(umi, umiPublicKey(wallet.publicKey));

            // Filter assets that belong to our Game Pass Collection
            const pass = assets.find(asset =>
                asset.updateAuthority.type === 'Collection' &&
                asset.updateAuthority.address.toString() === GAME_PASS_COLLECTION_ADDRESS
            );

            if (pass) {
                setOwnedPass(pass.publicKey.toString());
            } else {
                setOwnedPass(null);
            }
        } catch (err) {
            console.error("Error checking ownership:", err);
        }
    };

    useEffect(() => {
        if (wallet.connected) {
            checkOwnership();
        } else {
            setOwnedPass(null);
            setMintResult({ signature: "", address: "" });
        }
    }, [wallet.connected, wallet.publicKey]);

    const handleMint = async () => {
        if (!wallet.publicKey) {
            alert("Connect your wallet first!");
            return;
        }

        if (TREASURY_WALLET.includes("REPLACE_WITH")) {
            alert("Error: Treasury wallet not configured in solanaConfig.ts");
            return;
        }

        try {
            setIsLoading(true);
            setStatus("Preparing transaction...");

            const umi = createUmi(SOLANA_RPC_URL)
                .use(mplCore())
                .use(walletAdapterIdentity(wallet));

            const assetSigner = generateSigner(umi);

            // Fetch the collection object to satisfy the type requirement
            const collectionAsset = await fetchCollection(umi, umiPublicKey(GAME_PASS_COLLECTION_ADDRESS));

            // 2. Build the multi-instruction transaction
            // Instruction 1: Pay 0.0025 SOL to Treasury
            // Instruction 2: Mint the Metaplex Core Pass into the collection
            const tx = await transactionBuilder()
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
                    })
                )
                .sendAndConfirm(umi);

            setMintResult({
                signature: tx.signature.toString(),
                address: assetSigner.publicKey.toString()
            });

            setStatus("Mint Successful!");
            checkOwnership(); // Refresh state

        } catch (err: any) {
            console.error(err);
            setStatus("Error: " + (err.message || "Mint failed"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '500px',
            margin: '2rem auto',
            backgroundColor: '#111827',
            borderRadius: '20px',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            border: '1px solid #374151'
        }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#f3f4f6' }}>
                Game Pass Mint
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Price: 0.0025 SOL
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <WalletMultiButton />
            </div>

            {wallet.connected && (
                <>
                    {ownedPass ? (
                        <div style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid #10b981',
                            padding: '1rem',
                            borderRadius: '12px',
                            marginBottom: '1rem'
                        }}>
                            <p style={{ color: '#10b981', fontWeight: 'bold', margin: 0 }}>✓ PASS FOUND</p>
                            <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.3rem', wordBreak: 'break-all' }}>
                                ID: {ownedPass}
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={handleMint}
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '15px',
                                background: 'linear-gradient(to right, #8b5cf6, #d946ef)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                cursor: isLoading ? 'default' : 'pointer',
                                opacity: isLoading ? 0.7 : 1,
                                transition: 'transform 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            {isLoading ? "Processing..." : "Mint Game Pass"}
                        </button>
                    )}
                </>
            )}

            {status && (
                <p style={{
                    marginTop: '1.5rem',
                    color: status.includes('Error') ? '#f87171' : '#a78bfa',
                    fontSize: '0.9rem'
                }}>
                    {status}
                </p>
            )}

            {mintResult.address && (
                <div style={{
                    marginTop: '2rem',
                    textAlign: 'left',
                    padding: '1rem',
                    backgroundColor: '#1f2937',
                    borderRadius: '12px'
                }}>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>SUCCESSFULLY MINTED:</p>
                    <p style={{ fontSize: '0.85rem', color: '#d1d5db', wordBreak: 'break-all', marginBottom: '1rem' }}>
                        <span style={{ color: '#8b5cf6' }}>Asset:</span> {mintResult.address}
                    </p>
                    <a
                        href={`https://solscan.io/tx/${mintResult.signature}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#60a5fa', fontSize: '0.8rem', textDecoration: 'none' }}
                    >
                        View Transaction ↗
                    </a>
                </div>
            )}
        </div>
    );
};
