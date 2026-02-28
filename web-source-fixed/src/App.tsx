import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SolanaWrapper } from './components/SolanaWrapper';
import Game from './pages/Game';

import { ConsentPopup } from './components/game/ConsentPopup';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SolanaWrapper>
      <Game />
      <ConsentPopup />
    </SolanaWrapper>
  </QueryClientProvider>
);

export default App;
