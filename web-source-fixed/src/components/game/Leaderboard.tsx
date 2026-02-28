import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Users, Calendar, Loader2 } from 'lucide-react';

interface ScoreEntry {
    id: number;
    wallet: string;
    score: number;
    created_at: string;
}

export const Leaderboard = () => {
    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchScores = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('leaderboard')
                .select('*')
                .order('score', { ascending: false })
                .limit(100);

            if (error) throw error;
            setScores(data || []);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScores();
    }, []);

    const formatWallet = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="w-full mx-auto flex flex-col glass-panel rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="font-display font-bold text-white tracking-tight">GLOBAL LEADERBOARD</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest">
                    <Users className="w-3 h-3" />
                    Top 100
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        <span className="text-xs font-medium tracking-widest uppercase">LOADING SCORES...</span>
                    </div>
                ) : scores.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                        <span className="text-xs font-medium tracking-widest uppercase italic text-center">No scores yet.<br />Be the first to dominate!</span>
                    </div>
                ) : (
                    <table className="w-full text-left border-separate border-spacing-y-1">
                        <thead>
                            <tr className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                <th className="px-4 py-2">RANK</th>
                                <th className="px-4 py-2">PLAYER</th>
                                <th className="px-4 py-2 text-right">SCORE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scores.map((entry, index) => (
                                <tr key={entry.id} className="group transition-all hover:bg-white/5 rounded-xl">
                                    <td className="px-4 py-3 align-middle">
                                        <div className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black
                                            ${index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                index === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                                                    index === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' :
                                                        'bg-white/5 text-muted-foreground'}
                                        `}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                                                {formatWallet(entry.wallet)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                                                <Calendar className="w-2.5 h-2.5" />
                                                {formatDate(entry.created_at)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight">
                                            {entry.score.toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
