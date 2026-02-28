import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

import { SOLANA_RPC_URL } from '@/lib/solanaConfig';

// Default styles for wallet modal
import '@solana/wallet-adapter-react-ui/styles.css';

/**
 * SolanaWrapper — provides wallet context to the app.
 *
 * SolanaMobileWalletAdapter is intentionally removed: it requires
 * the Solana dApp Store / Seed Vault hardware (Saga phone).
 * On a standard Android WebView it throws and breaks the entire
 * component tree. Phantom + Solflare work via their mobile browsers
 * or via deep-link on any Android device.
 */
export const SolanaWrapper = ({ children }: { children: React.ReactNode }) => {
    const endpoint = useMemo(() => SOLANA_RPC_URL, []);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
        ],
        []
    );

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
