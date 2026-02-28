import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet } from 'lucide-react';
import { shortenAddress } from '@/lib/storage';

/**
 * Custom WalletButton to replace the stock Solana adapter button.
 * Ensures only ONE icon is shown, preferring the specific wallet provider's icon.
 */
const WalletButton = () => {
  const { publicKey, wallet, connected, connecting, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnect = () => {
    setVisible(true);
  };

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="btn-premium glass-panel flex items-center gap-2 px-4 py-2 text-[10px] font-display text-foreground tracking-wider group hover:bg-white/5 transition-all duration-300"
      >
        <Wallet className="w-3.5 h-3.5 text-neon-purple/80 group-hover:text-white transition-colors" />
        <span className="font-bold">{connecting ? 'CONNECTING...' : 'CONNECT WALLET'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => disconnect()}
      className="btn-premium glass-panel flex items-center gap-2 px-3 py-2 text-[10px] font-display text-foreground tracking-wider group hover:bg-white/5 transition-all border-white/20"
      title="Click to Disconnect"
    >
      {/* Show ONLY provider icon when connected */}
      {wallet?.adapter.icon ? (
        <img
          src={wallet.adapter.icon}
          alt={wallet.adapter.name}
          className="w-4 h-4 rounded-md filter drop-shadow(0 0 4px rgba(0,0,0,0.5))"
        />
      ) : (
        <Wallet className="w-3.5 h-3.5 text-green-400" />
      )}
      <span className="font-bold opacity-80 group-hover:opacity-100 transition-opacity">
        {publicKey ? shortenAddress(publicKey.toString()) : 'CONNECTED'}
      </span>
      <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse ring-2 ring-green-400/20" />
    </button>
  );
};

export default WalletButton;
