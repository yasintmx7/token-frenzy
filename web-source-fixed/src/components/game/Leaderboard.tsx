import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Users, Calendar, Loader2, Zap, Layout } from 'lucide-react';
import { type GameMode } from '@/lib/gameEngine';
import { useNativeWallet } from '@/components/NativeWalletContext';

interface ScoreEntry {
    id: number;
    wallet: string;
    score: number;
    mode: string;
    created_at: string;
}

export const Leaderboard = () => {
    const { walletAddress } = useNativeWallet();
    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMode, setSelectedMode] = useState<GameMode>('classic');

    const fetchScores = async (mode: GameMode) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('leaderboard')
                .select('*')
                .eq('mode', mode)
                .order('score', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Clean up duplicates by wallet - keeping only the first (highest score) entry
            // (Though GameOver now handles this, legacy data might still have duplicates)
            const sortedData = data || [];
            const uniqueData: ScoreEntry[] = [];
            const seenWallets = new Set();

            for (const item of sortedData) {
                if (!seenWallets.has(item.wallet)) {
                    seenWallets.add(item.wallet);
                    uniqueData.push(item);
                }
                if (uniqueData.length >= 100) break;
            }

            setScores(uniqueData);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchScores(selectedMode);
    }, [selectedMode]);

    const formatWallet = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="w-full h-full mx-auto flex flex-col glass-panel rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header - Fixed */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col gap-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <h3 className="font-display font-bold text-white tracking-tight uppercase">Rankings</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest">
                        <Users className="w-3 h-3" />
                        Top 100
                    </div>
                </div>

                {/* Tabs - Fixed */}
                <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                    <button
                        onClick={() => setSelectedMode('classic')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all
                            ${selectedMode === 'classic'
                                ? 'bg-white/10 text-white shadow-lg border border-white/10'
                                : 'text-muted-foreground hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <Layout className="w-3 h-3" />
                        Classic
                    </button>
                    <button
                        onClick={() => setSelectedMode('frustration')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all
                            ${selectedMode === 'frustration'
                                ? 'bg-purple-500/20 text-purple-400 shadow-lg border border-purple-500/20'
                                : 'text-muted-foreground hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <Zap className="w-3 h-3" />
                        Frenzy
                    </button>
                    <button
                        onClick={() => setSelectedMode('zen')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all
                            ${selectedMode === 'zen'
                                ? 'bg-blue-500/20 text-blue-400 shadow-lg border border-blue-500/20'
                                : 'text-muted-foreground hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <Calendar className="w-3 h-3" />
                        Chill
                    </button>
                </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {loading ? (
                    <div className="h-full py-20 flex flex-col items-center justify-center gap-3 opacity-50">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        <span className="text-xs font-medium tracking-widest uppercase">Fetching {selectedMode} scores...</span>
                    </div>
                ) : scores.length === 0 ? (
                    <div className="h-full py-20 flex flex-col items-center justify-center opacity-30">
                        <span className="text-xs font-medium tracking-widest uppercase italic text-center">No scores yet for {selectedMode}.<br />Start the frenzy!</span>
                    </div>
                ) : (
                    <table className="w-full text-left border-separate border-spacing-y-1 border-spacing-x-0">
                        <thead className="sticky top-0 z-10">
                            <tr className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                <th className="px-4 py-3 rounded-l-2xl bg-white/5 backdrop-blur-md">RANK</th>
                                <th className="px-4 py-3 bg-white/5 backdrop-blur-md">PLAYER</th>
                                <th className="px-4 py-3 text-right rounded-r-2xl bg-white/5 backdrop-blur-md">SCORE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scores.map((entry, index) => {
                                const isUser = walletAddress && entry.wallet.toLowerCase() === walletAddress.toLowerCase();
                                return (
                                    <tr
                                        key={entry.id}
                                        className={`transition-all ${isUser ? 'relative' : 'rounded-xl'}`}
                                    >
                                        <td className={`px-4 py-3 align-middle transition-all ${isUser ? 'bg-purple-600/30 rounded-l-2xl' : ''}`}>
                                            <div className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black
                                                ${index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                    index === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                                                        index === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' :
                                                            isUser ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/5 text-muted-foreground'}
                                            `}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className={`px-4 py-3 transition-all ${isUser ? 'bg-purple-600/30' : ''}`}>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold transition-colors ${isUser ? 'text-white' : 'text-white'}`}>
                                                        {formatWallet(entry.wallet)}
                                                    </span>
                                                    {isUser && (
                                                        <span className="text-[8px] font-black bg-white text-purple-700 px-1.5 py-0.5 rounded tracking-tighter uppercase shadow-sm">
                                                            YOU
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] flex items-center gap-1 ${isUser ? 'text-purple-200/60' : 'text-muted-foreground/60'}`}>
                                                    <Calendar className="w-2.5 h-2.5" />
                                                    {formatDate(entry.created_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={`px-4 py-3 text-right transition-all ${isUser ? 'bg-purple-600/30 rounded-r-2xl' : ''}`}>
                                            <span className={`text-sm font-black tracking-tight ${isUser ? 'text-white' : (selectedMode === 'frustration' ? 'text-purple-400' : selectedMode === 'zen' ? 'text-blue-400' : 'text-amber-400')}`}>
                                                {entry.score.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
