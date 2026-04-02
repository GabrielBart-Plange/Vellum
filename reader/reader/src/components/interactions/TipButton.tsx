"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { tipCreator } from "@/lib/monetization/coinService";

interface TipButtonProps {
    creatorId: string;
    creatorName: string;
}

export default function TipButton({ creatorId, creatorName }: TipButtonProps) {
    const { user, monetization } = useAuth();
    const [isTipping, setIsTipping] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const handleTip = async (amount: number) => {
        if (!user || !monetization) return;

        if (monetization.inkletWallet.balance < amount) {
            alert("Insufficient Inklets. Please top up your wallet.");
            return;
        }

        setIsTipping(true);
        try {
            const success = await tipCreator(user.uid, user.displayName || "User", creatorId, amount);
            if (success) {
                // Success feedback
                alert(`You offered ${amount} Gilt to ${creatorName}!`);
                setShowOptions(false);
            } else {
                alert("The offering failed to reach the archives. Please try again.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsTipping(false);
        }
    };

    const tipOptions = [10, 50, 100, 500];

    if (!user || user.uid === creatorId) return null;

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center gap-3 px-8 py-3 bg-zinc-900/40 border border-white/10 text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-zinc-800 hover:text-[var(--reader-accent)] transition-all rounded-xl italic group"
                title="Offer Gilt to the Creator"
            >
                <div className="w-4 h-4 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 group-hover:border-amber-500/60 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] group-hover:scale-125 transition-transform" />
                </div>
                Offer Gilt
            </button>

            {showOptions && (
                <div className="absolute bottom-full left-0 mb-4 p-6 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 z-[100] min-w-[200px]">
                    <p className="text-[9px] uppercase tracking-[0.3em] font-black text-amber-400/60 italic text-center">Manifest your offering</p>
                    <div className="flex gap-3 justify-center">
                        {tipOptions.map((amount) => (
                            <button
                                key={amount}
                                disabled={isTipping}
                                onClick={() => handleTip(amount)}
                                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center text-[10px] font-black shadow-lg hover:scale-110 active:scale-95"
                            >
                                {amount}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowOptions(false)}
                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                        Retract Offering
                    </button>
                </div>
            )}
        </div>
    );
}
