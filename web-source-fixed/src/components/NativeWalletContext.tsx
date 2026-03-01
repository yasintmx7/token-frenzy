/**
 * NativeWalletContext — Shared React context for native Android wallet state.
 *
 * When WalletButton calls window.Android.connectWallet(), the native Kotlin
 * SolanaWallet.connect() runs and calls back with the address. This context
 * stores that address and provides it to ALL components (MintOverlay, GameOver,
 * Game, etc.) so they all see the same connected/disconnected state.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface NativeWalletState {
    /** The connected wallet address, or null if not connected */
    walletAddress: string | null;
    /** Whether a wallet is currently connected */
    connected: boolean;
    /** Whether a connect operation is in progress */
    connecting: boolean;
    /** Connect wallet via native Android MWA */
    connect: () => void;
    /** Disconnect the wallet */
    disconnect: () => void;
    /** Send SOL to an address — returns tx signature via callback */
    sendSol: (to: string, amount: number) => Promise<string>;
    /** Mint Game Pass — pays SOL + creates NFT via Helius */
    mintGamePass: () => Promise<string>;
}

const NativeWalletContext = createContext<NativeWalletState>({
    walletAddress: null,
    connected: false,
    connecting: false,
    connect: () => { },
    disconnect: () => { },
    sendSol: async () => '',
    mintGamePass: async () => '',
});

export const useNativeWallet = () => useContext(NativeWalletContext);

export const NativeWalletProvider = ({ children }: { children: ReactNode }) => {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);

    // Check if already connected on mount
    useEffect(() => {
        try {
            if (window.Android?.isWalletConnected?.()) {
                const addr = window.Android.getWalletAddress();
                if (addr) setWalletAddress(addr);
            }
            if (window.__nativeWalletAddress) {
                setWalletAddress(window.__nativeWalletAddress);
                delete window.__nativeWalletAddress;
            }
        } catch (e) {
            console.log('[NativeWallet] Init check error:', e);
        }
    }, []);

    // Register global callbacks from the native bridge
    useEffect(() => {
        window.__onNativeWalletConnected = (address: string) => {
            console.log('[NativeWallet] Connected:', address);
            setWalletAddress(address);
            setConnecting(false);
        };
        window.__onNativeWalletDisconnected = () => {
            console.log('[NativeWallet] Disconnected');
            setWalletAddress(null);
        };
        window.__onNativeWalletError = (error: string) => {
            console.error('[NativeWallet] Error:', error);
            setConnecting(false);
        };
        return () => {
            delete window.__onNativeWalletConnected;
            delete window.__onNativeWalletDisconnected;
            delete window.__onNativeWalletError;
        };
    }, []);

    const connect = useCallback(() => {
        if (!window.Android?.connectWallet) {
            console.error('[NativeWallet] Android bridge not available');
            return;
        }
        setConnecting(true);
        window.Android.connectWallet();
    }, []);

    const disconnect = useCallback(() => {
        if (window.Android?.disconnectWallet) {
            window.Android.disconnectWallet();
        }
        setWalletAddress(null);
    }, []);

    /**
     * Send SOL using the native Kotlin SolanaWallet.sendSol().
     * Returns a promise that resolves with the transaction signature.
     */
    const sendSol = useCallback((to: string, amount: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!window.Android?.sendSol) {
                reject(new Error('Native bridge not available'));
                return;
            }
            // Set up one-time callbacks
            window.__onNativeTxSuccess = (signature: string) => {
                delete window.__onNativeTxSuccess;
                delete window.__onNativeTxError;
                resolve(signature);
            };
            window.__onNativeTxError = (error: string) => {
                delete window.__onNativeTxSuccess;
                delete window.__onNativeTxError;
                reject(new Error(error));
            };
            window.Android.sendSol(to, amount);
        });
    }, []);

    /**
     * Mint Game Pass — pays 0.0025 SOL + mints NFT via Helius API.
     * Returns a promise that resolves with the mint result.
     */
    const mintGamePass = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!window.Android?.mintGamePass) {
                reject(new Error('Native bridge not available'));
                return;
            }
            window.__onNativeMintSuccess = (result: string) => {
                delete window.__onNativeMintSuccess;
                delete window.__onNativeMintError;
                resolve(result);
            };
            window.__onNativeMintError = (error: string) => {
                delete window.__onNativeMintSuccess;
                delete window.__onNativeMintError;
                reject(new Error(error));
            };
            window.Android.mintGamePass();
        });
    }, []);

    return (
        <NativeWalletContext.Provider value={{
            walletAddress,
            connected: !!walletAddress,
            connecting,
            connect,
            disconnect,
            sendSol,
            mintGamePass,
        }}>
            {children}
        </NativeWalletContext.Provider>
    );
};
