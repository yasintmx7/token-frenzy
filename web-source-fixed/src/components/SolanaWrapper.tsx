/**
 * SolanaWrapper — Official Mobile Wallet Adapter for Web
 *
 * Per the official Solana Mobile docs (https://docs.solanamobile.com/get-started/web/installation):
 *
 * 1. Install:  npm install @solana-mobile/wallet-standard-mobile
 * 2. Call registerMwa() once at startup.
 *    This registers Mobile Wallet Adapter as a Wallet Standard wallet so that
 *    @solana/wallet-adapter-react picks it up automatically — no custom adapter class needed.
 * 3. The WalletProvider wallets=[...] array can stay empty; registered Standard wallets
 *    are discovered automatically by the adapter ecosystem.
 */

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// Official Solana Mobile Wallet Standard package (web apps)
// https://docs.solanamobile.com/get-started/web/installation
import {
    createDefaultAuthorizationCache,
    createDefaultChainSelector,
    createDefaultWalletNotFoundHandler,
    registerMwa,
} from '@solana-mobile/wallet-standard-mobile';

import { SOLANA_RPC_URL } from '@/lib/solanaConfig';
import '@solana/wallet-adapter-react-ui/styles.css';

// Register MWA once at module-load time (not inside a React component).
// This call makes any installed Solana wallet app on the device available
// as a selectable wallet in the standard wallet modal.
registerMwa({
    appIdentity: {
        name: 'Token Frenzy',
        uri: 'https://tokenfrenzy.app',
        icon: 'favicon.ico',
    },
    authorizationCache: createDefaultAuthorizationCache(),
    // Support both mainnet and devnet
    chains: ['solana:mainnet', 'solana:devnet'],
    chainSelector: createDefaultChainSelector(),
    onWalletNotFound: createDefaultWalletNotFoundHandler(),
});

import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import {
    SolanaMobileWalletAdapter,
    createDefaultAddressSelector,
    createDefaultAuthorizationResultCache,
    createDefaultWalletNotFoundHandler as smwaCreateDefaultWalletNotFoundHandler
} from '@solana-mobile/wallet-adapter-mobile';

export const SolanaWrapper = ({ children }: { children: React.ReactNode }) => {
    const endpoint = useMemo(() => SOLANA_RPC_URL, []);

    // Pass an array of popular wallets including Solana Mobile Wallet Adapter
    // MWA is auto-registered via registerMwa, but using SMWA class forces compatibility
    // with certain older dApp browsers.
    const wallets = useMemo(() => [
        new SolanaMobileWalletAdapter({
            addressSelector: createDefaultAddressSelector(),
            appIdentity: {
                name: 'Token Frenzy',
                uri: 'https://tokenfrenzy.app',
                icon: 'favicon.ico',
            },
            authorizationResultCache: createDefaultAuthorizationResultCache(),
            cluster: 'mainnet-beta',
            onWalletNotFound: smwaCreateDefaultWalletNotFoundHandler(),
        }),
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
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
