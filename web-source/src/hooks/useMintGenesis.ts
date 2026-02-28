import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { base } from 'wagmi/chains';
import { setHasMintedGenesis } from '@/lib/storage';

// Fee recipient — replace with your wallet address or a burn address
const MINT_TARGET = '0x0000000000000000000000000000000000000001' as `0x${string}`; // Burn/Mint address
const MINT_PRICE = '0'; // Free mint

export function useMintGenesis() {
    const { address, isConnected } = useAccount();

    const { writeContract, data: txHash, isPending: isWriting, error: writeError, reset } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    useEffect(() => {
        if (isSuccess) {
            setHasMintedGenesis(true);
        }
    }, [isSuccess]);

    const mintGenesis = () => {
        if (!isConnected || !address) return;

        // Send a simple 0 ETH transaction to simulate minting
        writeContract({
            abi: [] as const,
            address: MINT_TARGET,
            functionName: undefined as any,
            value: parseEther(MINT_PRICE),
            chain: base,
        } as any);
    };

    return {
        mintGenesis,
        isConnected,
        isWriting,
        isConfirming,
        isSuccess,
        error: writeError,
        txHash,
        reset,
    };
}
