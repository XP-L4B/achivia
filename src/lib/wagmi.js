import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Configurazione wallet: testnet Sepolia + connettore "injected" (MetaMask & co.).
// Nessun secret necessario; per WalletConnect servirebbe un projectId (slice successiva).
export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
  },
});
