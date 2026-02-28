import { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { loadProgress, setHasAcceptedTerms } from '@/lib/storage';
import { LegalModal } from './LegalModals';

export const ConsentPopup = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({ isOpen: false, type: 'privacy' });

    useEffect(() => {
        const progress = loadProgress();
        if (!progress.hasAcceptedTerms) {
            // Auto-accept in APK/WebView build — consent is covered by Play Store install
            setHasAcceptedTerms(true);
            setIsVisible(false);
        }
    }, []);

    const handleAccept = () => {
        setHasAcceptedTerms(true);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
            <div className="relative w-full max-w-sm glass-panel-strong rounded-[2.5rem] p-8 space-y-8 border-white/10 shadow-[0_0_80px_-20px_rgba(139,92,246,0.4)]">

                {/* Icon & Title */}
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                        <ShieldCheck className="w-8 h-8 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-display font-black tracking-wider text-white">
                        PLAYER CONSENT
                    </h2>
                </div>

                {/* Text */}
                <p className="text-xs text-muted-foreground leading-relaxed text-center">
                    By continuing to play <span className="text-white font-bold">TOKEN FRENZY</span>, you agree to our
                    <button
                        onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
                        className="text-purple-400 hover:text-purple-300 mx-1 underline underline-offset-2"
                    >
                        Privacy Policy
                    </button>
                    and
                    <button
                        onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
                        className="text-purple-400 hover:text-purple-300 mx-1 underline underline-offset-2"
                    >
                        Terms & Conditions
                    </button>.
                </p>

                {/* Benefits/Info */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                        <span className="text-[10px] font-display font-bold tracking-wider text-white/80">SECURE WALLET AUTH</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                        <span className="text-[10px] font-display font-bold tracking-wider text-white/80">FAIR GLOBAL RANKINGS</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <button
                        onClick={handleAccept}
                        className="w-full btn-premium flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 transition-all text-sm font-bold tracking-widest"
                    >
                        I AGREE & CONTINUE
                        <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
                            className="text-[9px] text-muted-foreground hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors"
                        >
                            Privacy <ExternalLink className="w-2 h-2" />
                        </button>
                        <button
                            onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
                            className="text-[9px] text-muted-foreground hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors"
                        >
                            Terms <ExternalLink className="w-2 h-2" />
                        </button>
                    </div>
                </div>
            </div>

            <LegalModal
                isOpen={legalModal.isOpen}
                onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
                type={legalModal.type}
            />
        </div>
    );
};
