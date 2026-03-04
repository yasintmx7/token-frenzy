import { useState, useRef } from 'react';
import { Wallet, Loader2 } from 'lucide-react';
import { useNativeWallet } from '@/components/NativeWalletContext';

interface MintOverlayProps {
    onSuccess: () => void;
}

export const MintOverlay = ({ onSuccess }: MintOverlayProps) => {
    const { connected, connecting, connect, mintGamePass } = useNativeWallet();
    const [status, setStatus] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const isMintingRef = useRef(false);

    const handleMint = async () => {
        if (isMintingRef.current || isLoading || !connected) return;
        isMintingRef.current = true;

        try {
            setIsLoading(true);
            setStatus("Opening wallet...");

            const result = await mintGamePass();
            console.log('[MintOverlay] Mint result:', result);

            setStatus("Game Pass minted! Unlocking game...");
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            console.error('[MintOverlay] Mint error:', err);
            const msg = err?.message || 'Unknown error';
            if (msg.includes('rejected') || msg.includes('declined') || msg.includes('cancelled') || msg.includes('not signed')) {
                setStatus("Mint cancelled");
            } else if (msg.includes('Already processing')) {
                setStatus("Already processing...");
            } else {
                setStatus("Error: " + msg);
            }
            setIsLoading(false);
            isMintingRef.current = false;
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
            padding: '1rem',
            textAlign: 'center'
        }}>
            <div style={{
                maxWidth: '400px',
                width: '100%',
                maxHeight: '100%',
                overflowY: 'auto',
                padding: '2rem 1.5rem',
                backgroundColor: '#111827',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'columm',
            }} className="flex-col">
                <div style={{
                    width: '100px',
                    height: '150px',
                    margin: '0 auto 1.5rem',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: '#1f2937',
                    flexShrink: 0
                }}>
                    <img
                        src="https://gateway.pinata.cloud/ipfs/bafybeielmvw7uejrf4e3qx7zteojlkjab3jox62x22cnodbghquzbv2lva"
                        alt="Game Pass Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                    TRIAL ENDED
                </h2>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem', lineHeight: '1.5', fontSize: '0.85rem' }}>
                    Mint a permanent <strong>Game Pass NFT</strong> to continue playing and save your progress.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                    {!connected ? (
                        <button
                            onClick={connect}
                            disabled={connecting}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: 'white',
                                color: 'black',
                                border: 'none',
                                borderRadius: '14px',
                                fontWeight: '900',
                                fontSize: '0.9rem',
                                cursor: connecting ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: connecting ? 0.7 : 1,
                            }}
                        >
                            {connecting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Wallet className="w-4 h-4" />
                            )}
                            {connecting ? 'CONNECTING...' : 'CONNECT WALLET'}
                        </button>
                    ) : (
                        <button
                            onClick={handleMint}
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: isLoading
                                    ? 'linear-gradient(135deg, #6b5798 0%, #a03ab8 100%)'
                                    : 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '14px',
                                fontWeight: '900',
                                fontSize: '0.95rem',
                                cursor: isLoading ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: isLoading ? 'none' : '0 10px 15px -3px rgba(139, 92, 246, 0.3)',
                                opacity: isLoading ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLoading
                                ? (status.includes('Opening') ? 'OPENING WALLET...' : 'WAITING FOR CONFIRMATION...')
                                : 'MINT PASS (◎ 0.013 SOL)'}
                        </button>
                    )}
                </div>

                {status && (
                    <p style={{
                        marginTop: '1rem',
                        color: status.includes('Error') || status.includes('cancelled') || status.includes('failed')
                            ? '#f87171'
                            : status.includes('minted') || status.includes('Unlocking')
                                ? '#34d399'
                                : '#a78bfa',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                    }}>
                        {status}
                    </p>
                )}
            </div>
        </div>
    );
};