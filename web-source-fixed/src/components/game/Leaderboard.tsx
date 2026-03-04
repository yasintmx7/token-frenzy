import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Users, Calendar, Loader2, Zap, Layout, X, Star, Flame, Shield, Sword, Package, User } from 'lucide-react';
import { type GameMode } from '@/lib/gameEngine';
import { useNativeWallet } from '@/components/NativeWalletContext';
import { getCloudProgress, type PlayerProgress } from '@/lib/storage';
import { computeLevelFromTotalXp, XP_CONFIG } from '@/lib/xp';

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
    const [viewingProfile, setViewingProfile] = useState<{ wallet: string; data: PlayerProgress | null } | null>(null);

    const openProfile = async (wallet: string) => {
        setViewingProfile({ wallet, data: null });
        const data = await getCloudProgress(wallet);
        setViewingProfile({ wallet, data });
    };

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
                                        onClick={() => openProfile(entry.wallet)}
                                        className={`transition-all group cursor-pointer hover:bg-white/5 active:scale-[0.98] ${isUser ? 'relative' : 'rounded-xl'}`}
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
            {/* Profile Modal Overlay */}
            {viewingProfile && (
                <ProfileModal
                    wallet={viewingProfile.wallet}
                    profile={viewingProfile.data}
                    onClose={() => setViewingProfile(null)}
                />
            )}
        </div>
    );
};

function ProfileModal({ wallet, profile, onClose }: { wallet: string; profile: PlayerProgress | null; onClose: () => void }) {
    if (!profile) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="w-full max-w-[320px] glass-panel rounded-[24px] p-8 flex flex-col items-center gap-4 border-white/10 shadow-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    <p className="text-xs font-black tracking-widest text-muted-foreground uppercase text-center">Loading Profile Data...</p>
                    <button onClick={onClose} className="mt-4 px-6 py-2 rounded-xl bg-white/5 text-[10px] font-bold tracking-widest uppercase hover:bg-white/10 transition-colors">Close</button>
                </div>
            </div>
        );
    }

    const { level } = computeLevelFromTotalXp(profile.totalXp);
    const totalItems = (profile.ownedBlades?.length || 0) + (profile.ownedBoards?.length || 0) + (profile.ownedFrames?.length || 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-[340px] glass-panel rounded-[28px] overflow-hidden border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-in scale-in duration-300">
                {/* Header/Banner */}
                <div className="h-24 bg-gradient-to-br from-purple-600/30 to-blue-600/30 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors z-20"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Profile Info */}
                <div className="px-6 pb-8 -mt-10 flex flex-col items-center relative z-10 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-[#0b071a] border-4 border-[#140b2e] flex items-center justify-center shadow-xl mb-3 relative overflow-hidden">
                        <User className="w-10 h-10 text-purple-400" />
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent" />
                    </div>

                    <h2 className="text-xl font-display font-black text-white tracking-tight leading-tight">
                        {profile.username || "Anonymous Hero"}
                    </h2>
                    <p className="text-[10px] font-mono font-bold text-muted-foreground mt-1 mb-4 select-all">
                        {wallet.slice(0, 8)}...{wallet.slice(-8)}
                    </p>

                    {/* Level Badge */}
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1.5 rounded-full mb-6 shadow-lg shadow-orange-500/20">
                        <Shield className="w-3.5 h-3.5 text-white" />
                        <span className="text-[10px] font-black text-white italic tracking-tighter">LEVEL {level}</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 w-full mb-6">
                        <StatItem label="TOTAL SCORE" value={profile.totalScore.toLocaleString()} icon={Trophy} color="text-amber-400" />
                        <StatItem label="XP EARNED" value={profile.totalXp.toLocaleString()} icon={Star} color="text-cyan-400" />
                        <StatItem label="BEST COMBO" value={`x${profile.bestCombo}`} icon={Flame} color="text-orange-500" />
                        <StatItem label="SLICED" value={profile.totalTokensSliced.toLocaleString()} icon={Sword} color="text-pink-400" />
                    </div>

                    {/* Collection Stats */}
                    <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <Package className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="text-left">
                                <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">COLLECTION</div>
                                <div className="text-sm font-black text-white">{totalItems} ITEMS</div>
                            </div>
                        </div>
                        <div className="flex -space-x-2">
                            {Array.from({ length: Math.min(3, totalItems) }).map((_, i) => (
                                <div key={i} className="w-6 h-6 rounded-full bg-white/10 border-2 border-[#140b2e]" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
    return (
        <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
            <Icon className={`w-4 h-4 mb-2 ${color}`} />
            <div className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">{label}</div>
            <div className="text-sm font-black text-white">{value}</div>
        </div>
    );
}
