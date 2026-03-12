"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { purchaseCoins } from "@/lib/monetization/coinService";

export default function WalletCard() {
    const { user, monetization } = useAuth();
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const handlePurchase = async (amount: number) => {
        if (!user) return;
        setIsPurchasing(true);
        try {
            const success = await purchaseCoins(user.uid, amount);
            if (success) {
                // Success feedback (monetization state should update via Firestore sync)
                setShowOptions(false);
            } else {
                alert("Purchase failed. Please try again.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsPurchasing(false);
        }
    };

    const options = [
        { amount: 100, price: "GHS 5", label: "Pouch of Essence" },
        { amount: 500, price: "GHS 20", label: "Chest of Essence" },
        { amount: 1200, price: "GHS 45", label: "Coffer of Essence" },
    ];

    if (!user) return null;

    return (
        <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-8 bg-zinc-900/20">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Essence Balance</p>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
                        </div>
                        <span className="text-3xl font-black text-white italic tracking-tighter">
                            {monetization?.essenceWallet.balance.toLocaleString() || 0}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                >
                    {showOptions ? "Cancel" : "Top Up"}
                </button>
            </div>

            {showOptions && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 animate-in fade-in slide-in-from-top-4">
                    {options.map((opt) => (
                        <button
                            key={opt.amount}
                            disabled={isPurchasing}
                            onClick={() => handlePurchase(opt.amount)}
                            className="p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-amber-500/30 transition-all text-left space-y-2 group"
                        >
                            <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold group-hover:text-amber-400">{opt.label}</p>
                            <p className="text-xl font-black text-white">{opt.amount} Essence</p>
                            <p className="text-[10px] text-zinc-400">{opt.price}</p>
                        </button>
                    ))}
                </div>
            )}

            {isPurchasing && (
                <div className="text-center py-4 text-[10px] uppercase tracking-[0.3em] text-amber-500 font-bold animate-pulse">
                    Summoning Essence...
                </div>
            )}
        </div>
    );
}
