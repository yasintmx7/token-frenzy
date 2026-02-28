import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { base } from 'wagmi/chains';
import { addLeaderboardEntry } from '@/lib/storage';

// Fee recipient — replace with your wallet address
const FEE_RECIPIENT = '0x0000000000000000000000000000000000000001' as `0x${string}`;
const SUBMIT_FEE = '0'; // Fee is free, only gas is required as requested.

export function useSubmitScore() {
  const { address, isConnected } = useAccount();
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);

  const { writeContract, data: txHash, isPending: isWriting, error: writeError, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const submitScore = (score: number, mode: string, combo: number, sliced: number) => {
    if (!isConnected || !address) return;

    setSubmittedScore(score);

    // Send a simple ETH transfer as the submission fee
    writeContract({
      // We use a direct transfer via a minimal "receive" call
      // This sends ETH to the fee recipient
      abi: [] as const,
      address: FEE_RECIPIENT,
      functionName: undefined as any,
      value: parseEther(SUBMIT_FEE),
      chain: base,
    } as any);

    // Save to local leaderboard immediately (will show after tx confirms too)
    addLeaderboardEntry({
      address: address,
      score,
      mode,
      combo,
      sliced,
      timestamp: Date.now(),
    });
  };

  return {
    submitScore,
    isConnected,
    address,
    isWriting,
    isConfirming,
    isSuccess,
    error: writeError,
    txHash,
    submittedScore,
    reset,
    fee: SUBMIT_FEE,
  };
}
