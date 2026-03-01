import { Wallet } from 'lucide-react';
import { shortenAddress } from '@/lib/storage';
import { useNativeWallet } from '@/components/NativeWalletContext';

/**
 * WalletButton — Uses shared NativeWalletContext for connect/disconnect.
 */
const WalletButton = () => {
  const { walletAddress, connected, connecting, connect, disconnect } = useNativeWallet();

  if (!connected) {
    return (
      <button
        onClick={connect}
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
      onClick={disconnect}
      className="btn-premium glass-panel flex items-center gap-2 px-3 py-2 text-[10px] font-display text-foreground tracking-wider group hover:bg-white/5 transition-all border-white/20"
      title="Click to Disconnect"
    >
      <Wallet className="w-3.5 h-3.5 text-green-400" />
      <span className="font-bold opacity-80 group-hover:opacity-100 transition-opacity">
        {walletAddress ? shortenAddress(walletAddress) : 'CONNECTED'}
      </span>
      <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse ring-2 ring-green-400/20" />
    </button>
  );
};

export default WalletButton;
