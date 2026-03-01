/**
 * SolanaWrapper — Correct setup for an Android WebView app.
 *
 * In a WebView there are NO browser extensions, so we must NOT include
 * PhantomWalletAdapter or SolflareWalletAdapter (browser-extension adapters).
 * Those cause "download" prompts and "can't find wallet" errors.
 *
 * The ONLY adapter needed is SolanaMobileWalletAdapter (MWA).
 * When the user taps "Mobile Wallet Adapter", Android shows a native bottom
 * sheet with ALL installed MWA-compatible wallets (Phantom, Solflare, Seeker…).
 * The user picks one → that wallet app opens → signs → returns to game.
 */

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

import {
    SolanaMobileWalletAdapter,
    createDefaultAddressSelector,
    createDefaultAuthorizationResultCache,
    createDefaultWalletNotFoundHandler,
} from '@solana-mobile/wallet-adapter-mobile';

import { SOLANA_RPC_URL } from '@/lib/solanaConfig';
import '@solana/wallet-adapter-react-ui/styles.css';

export const SolanaWrapper = ({ children }: { children: React.ReactNode }) => {
    const endpoint = useMemo(() => SOLANA_RPC_URL, []);

    const wallets = useMemo(() => [
        /**
         * SolanaMobileWalletAdapter — the ONLY adapter needed in a WebView.
         *
         * It uses the Solana Mobile Wallet Adapter protocol (MWA) to discover
         * and communicate with ANY installed wallet app on the Android device
         * (Phantom, Solflare, Backpack, Solana Seeker, etc.) via local intents.
         *
         * The wallet picker bottom sheet is shown natively by the wallet app
         * itself — not by the web app.
         */
        new SolanaMobileWalletAdapter({
            addressSelector: createDefaultAddressSelector(),
            appIdentity: {
                name: 'Token Frenzy',
                uri: 'https://tokenfrenzy.app',
                icon: 'favicon.ico',
            },
            authorizationResultCache: createDefaultAuthorizationResultCache(),
            cluster: 'mainnet-beta',
            onWalletNotFound: createDefaultWalletNotFoundHandler(),
        }),
    ], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
