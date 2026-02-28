import { X, FileText, Shield } from 'lucide-react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'privacy' | 'terms';
}

export const LegalModal = ({ isOpen, onClose, type }: LegalModalProps) => {
    if (!isOpen) return null;

    const content = type === 'privacy' ? {
        title: 'PRIVACY POLICY',
        icon: Shield,
        sections: [
            {
                h: '1. Information We Collect',
                p: 'We use your public Solana wallet address for identification and access control. We do not require emails or passwords. We store your high scores and gameplay stats to maintain the Hall of Fame leaderboard.'
            },
            {
                h: '2. We DO NOT Collect Private Keys',
                p: 'We never have access to your private keys or seed phrases. Your wallet provider handles all signing and security. We will never ask you for your private key.'
            },
            {
                h: '3. Third-Party Services',
                p: 'We use Supabase for leaderboard storage, Helius for Solana RPC, and Pinata/IPFS for NFT assets and metadata hosting.'
            },
            {
                h: '4. Your Rights',
                p: 'Your wallet data is used for in-game utility. Blockchain transactions are public by design. You can request score removal by contacting us via our support channels.'
            }
        ]
    } : {
        title: 'TERMS & CONDITIONS',
        icon: FileText,
        sections: [
            {
                h: '1. License Grant',
                p: 'Token Frenzy grants you a limited, non-exclusive license for personal entertainment. Access to full gameplay requires ownership of the Game Pass NFT.'
            },
            {
                h: '2. Wallet Responsibility',
                p: 'You are solely responsible for your Solana wallet security. We cannot recover assets lost due to compromised wallets or user error.'
            },
            {
                h: '3. Anti-Cheat Policy',
                p: 'Bots, scripts, or score manipulation are strictly prohibited. We reserve the right to remove any leaderboard entries achieved through cheating.'
            },
            {
                h: '4. Limitation of Liability',
                p: 'The game is provided "as is". We are not liable for any loss of digital assets or data arising from your use of the application.'
            }
        ]
    };

    const ModalIcon = content.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg glass-panel-strong rounded-[2.5rem] p-8 max-h-[85vh] overflow-hidden flex flex-col border-white/10 shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)]">

                {/* Header */}
                <div className="flex items-center justify-between mb-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                            <ModalIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-display font-black tracking-wider text-white">
                                {content.title}
                            </h2>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Last updated: Feb 28, 2026</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5"
                    >
                        <X className="w-5 h-5 text-white/50" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                    {content.sections.map((section, i) => (
                        <div key={i} className="space-y-2">
                            <h3 className="text-sm font-display font-bold text-purple-300 tracking-wide uppercase">
                                {section.h}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {section.p}
                            </p>
                        </div>
                    ))}

                    <div className="pt-6 border-t border-white/5">
                        <p className="text-[10px] text-center text-muted-foreground/40 font-display tracking-widest uppercase">
                            Full documents available at tokenfrenzy.app
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
