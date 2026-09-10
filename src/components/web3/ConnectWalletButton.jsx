import { useAccount, useConnect, useDisconnect } from 'wagmi';

// Bottone "Connetti Wallet" basato su wagmi (connettore injected / MetaMask).
export default function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button
        className="px-btn ghost"
        style={{ width: 'auto' }}
        onClick={() => disconnect()}
      >
        {address.slice(0, 6)}…{address.slice(-4)} · Disconnetti
      </button>
    );
  }

  const connector = connectors[0];
  return (
    <button
      className="px-btn"
      style={{ width: 'auto' }}
      disabled={!connector || isPending}
      onClick={() => connector && connect({ connector })}
    >
      {isPending ? 'Connessione…' : 'Connetti Wallet'}
    </button>
  );
}
