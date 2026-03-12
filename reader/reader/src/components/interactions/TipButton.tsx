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

        if (monetization.essenceWallet.balance < amount) {
            alert("Insufficient Essence. Please top up your wallet.");
            return;
        }

        setIsTipping(true);
        try {
            const success = await tipCreator(user.uid, user.displayName || "User", creatorId, amount);
            if (success) {
                // Success feedback
                alert(`You sent ${amount} Essence to ${creatorName}!`);
                setShowOptions(false);
            } else {
                alert("Transaction failed. Please try again.");
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
                className="flex items-center gap-3 px-8 py-3 bg-zinc-900/40 border border-white/10 text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-zinc-800 hover:text-white transition-all rounded-xl"
            >
                <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                </div>
                Tip Archivist
            </button>

            {showOptions && (
                <div className="absolute bottom-full left-0 mb-4 p-4 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl flex gap-3 animate-in fade-in slide-in-from-bottom-4 z-[100]">
                    {tipOptions.map((amount) => (
                        <button
                            key={amount}
                            disabled={isTipping}
                            onClick={() => handleTip(amount)}
                            className="w-12 h-12 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center text-[10px] font-black"
                        >
                            {amount}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowOptions(false)}
                        className="w-12 h-12 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 transition-all flex items-center justify-center text-lg"
                    >
                        \u2715
                    </button>
                </div>
            )}
        </div>
    );
}
