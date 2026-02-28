import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';
import { http } from 'wagmi';

// Replace with your WalletConnect project ID from https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = 'YOUR_PROJECT_ID';

export const wagmiConfig = getDefaultConfig({
  appName: 'Token Frenzy',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});
