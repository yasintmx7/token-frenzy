import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';

const WalletButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none' as const, userSelect: 'none' as const },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="btn-premium glass-panel flex items-center gap-2 px-4 py-2 text-xs font-display text-foreground tracking-wider"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    CONNECT
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="glass-panel rounded-xl px-3 py-2 text-xs font-display text-destructive tracking-wider hover:bg-destructive/10 transition-colors"
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  className="glass-panel rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-white/[0.06] transition-colors"
                >
                  {chain.hasIcon && chain.iconUrl && (
                    <img
                      alt={chain.name ?? 'Chain'}
                      src={chain.iconUrl}
                      className="w-4 h-4 rounded-full"
                    />
                  )}
                  <span className="text-xs font-display text-foreground tracking-wider">
                    {account.displayName}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletButton;
