import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import router from './router';
import { wagmiConfig } from './lib/wagmi';
import { AuthProvider } from './context/AuthContext';
import SfondoVivo from './components/motion/SfondoVivo';
import { avvia as avviaMusica } from './data/musica';

const queryClient = new QueryClient();

export default function App() {
  // La musica prova a partire all'apertura. Se il browser non lascia
  // suonare prima che qualcuno abbia toccato la pagina — e non lo lascia —
  // parte al primo clic: se ne occupa `musica.js`.
  useEffect(() => { avviaMusica(); }, []);

  return (
    <>
      {/* Lo sfondo, le sue stelle e i suoi astri stanno sotto tutto il
          resto e fuori dal router: il castello non cambia da una pagina
          all'altra. */}
      <SfondoVivo />
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
}
