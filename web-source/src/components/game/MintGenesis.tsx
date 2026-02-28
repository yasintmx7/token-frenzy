import { useMintGenesis } from '@/hooks/useMintGenesis';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Loader2, Zap, ShieldCheck, Gem } from 'lucide-react';

interface MintGenesisProps {
    onMintComplete: () => void;
}

const MintGenesis = ({ onMintComplete }: MintGenesisProps) => {
    const { mintGenesis, isConnected, isWriting, isConfirming, isSuccess, txHash } = useMintGenesis();
    const { openConnectModal } = useConnectModal();

    // If success, user can proceed
    if (isSuccess) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl animate-scale-in px-6">
                <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-green-500/30 bg-green-500/5 shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)]">
                    <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4 ring-2 ring-green-500/50">
                        <ShieldCheck className="w-10 h-10 text-green-400" />
                    </div>

                    <h2 className="text-3xl font-display font-bold text-green-400 tracking-wide">
                        GENESIS MINTED!
                    </h2>

                    <p className="text-muted-foreground text-lg">
                        You have successfully claimed your Genesis NFT. You are now a verified slicer.
                    </p> 

                    <button
                        onClick={onMintComplete}
                        className="w-full py-4 rounded-xl font-bold bg-green-500 hover:bg-green-400 text-black transition-all hover:scale-[1.02] shadow-lg shadow-green-500/20"
                    >
                        CONTINUE TO GAME
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-lg animate-scale-in p-6">
            <div className="max-w-md w-full relative">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2rem] blur opacity-30 animate-pulse" />

                <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[1.8rem] p-8 space-y-8 overflow-hidden">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 rotate-3 hover:rotate-6 transition-transform">
                            <Gem className="w-8 h-8 text-white" />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-display font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white">
                            GENESIS MINT
                        </h2>

                        <p className="text-purple-300/80 font-medium">
                            Matches Played: 10/10
                        </p>
                    </div>

                    {/* Verification Steps */}
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <Zap className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white">Skill Verified</h3>
                                <p className="text-xs text-white/50">Completed 10 matches</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 animate-pulse">
                                <Gem className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white">Genesis NFT Required</h3>
                                <p className="text-xs text-white/50">Mint to unlock full access</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                        {!isConnected ? (
                            <button
                                onClick={openConnectModal}
                                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/25"
                            >
                                CONNECT WALLET
                            </button>
                        ) : (
                            <button
                                onClick={mintGenesis}
                                disabled={isWriting || isConfirming}
                                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-[1.02] shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {(isWriting || isConfirming) ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {isConfirming ? 'CONFIRMING...' : 'MINTING...'}
                                    </>
                                ) : (
                                    'MINT GENESIS NFT'
                                )}
                            </button>
                        )}

                        <p className="text-center text-[10px] text-white/30 mt-4">
                            Gas fees apply. This is a one-time verify action.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MintGenesis;
