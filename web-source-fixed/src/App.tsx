import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SolanaWrapper } from './components/SolanaWrapper';
import { NativeWalletProvider } from './components/NativeWalletContext';
import Game from './pages/Game';

import { ConsentPopup } from './components/game/ConsentPopup';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SolanaWrapper>
      <NativeWalletProvider>
        <Game />
        <ConsentPopup />
      </NativeWalletProvider>
    </SolanaWrapper>
  </QueryClientProvider>
);

export default App;
