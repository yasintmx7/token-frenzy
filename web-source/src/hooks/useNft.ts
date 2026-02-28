import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { base } from 'wagmi/chains';
import { parseEther } from 'viem';
import { NFT_CONTRACT, NFT_ABI, SKIN_TOKEN_IDS, MINT_PRICE } from '@/lib/nftContract';
import { useState } from 'react';

/**
 * Hook to check if the connected wallet owns a specific board skin NFT
 */
export function useNftOwnership(skinId: string) {
  const { address, isConnected } = useAccount();
  const tokenId = SKIN_TOKEN_IDS[skinId];

  const { data: ownsToken, isLoading, refetch } = useReadContract({
    address: NFT_CONTRACT.address,
    abi: NFT_ABI,
    functionName: 'ownsToken',
    args: address ? [address, BigInt(tokenId ?? 0)] : undefined,
    query: {
      enabled: isConnected && !!address && tokenId !== undefined && NFT_CONTRACT.address !== '0x0000000000000000000000000000000000000000',
    },
  });

  return {
    ownsNft: !!ownsToken,
    isLoading,
    isConnected,
    refetch,
  };
}

/**
 * Hook to mint a board skin NFT
 */
export function useMintSkin() {
  const [mintingSkinId, setMintingSkinId] = useState<string | null>(null);
  
  const { writeContract, data: txHash, isPending: isWriting, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const mint = (skinId: string) => {
    const tokenId = SKIN_TOKEN_IDS[skinId];
    if (tokenId === undefined) return;
    
    setMintingSkinId(skinId);
    writeContract({
      address: NFT_CONTRACT.address,
      abi: NFT_ABI,
      functionName: 'mint',
      args: [BigInt(tokenId)],
      value: parseEther(MINT_PRICE),
      chain: base,
    } as any);
  };

  return {
    mint,
    mintingSkinId,
    isWriting,
    isConfirming,
    isSuccess,
    error: writeError,
    txHash,
  };
}
