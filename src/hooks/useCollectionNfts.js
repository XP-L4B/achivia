import { useQuery } from '@tanstack/react-query';
import { fetchCollectionNfts } from '../lib/opensea';

// Carica gli NFT di un contratto su Sepolia tramite il proxy.
export function useCollectionNfts(contract) {
  return useQuery({
    queryKey: ['nfts', contract],
    queryFn: () => fetchCollectionNfts(contract),
    enabled: !!contract,
    staleTime: 60_000,
  });
}
