"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePaystackPayment } from "react-paystack";
import { purchaseInklets, purchaseVellux, purchaseGilt, subscribeToTier, verifyPaystackPayment } from "@/lib/monetization/coinService";
import { VelluxTier, SubscriptionTier } from "@/types";

export default function WalletCard() {
    const { user, monetization } = useAuth();
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showOptions, setShowOptions] = useState(false);



    const handlePaymentSuccess = async (reference: string, amount: number, priceGHS: number, type: string) => {
        setIsPurchasing(true);
        try {
            const success = await verifyPaystackPayment(reference, user!.uid, amount, priceGHS, type);
            if (success) {
                alert("Payment successful! Your balance has been updated.");
                setShowOptions(false);
            } else {
                alert("Verification failed. Please contact support if your money was deducted.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred during verification.");
        } finally {
            setIsPurchasing(false);
        }
    };

    const startPaystackPayment = (amount: number, priceGHS: number, type: string, label: string) => {
        const platformPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
        const userEmail = user?.email;

        if (!platformPublicKey) {
            console.error("Paystack Public Key is missing from environment variables.");
            alert("Payment system configuration error. Please contact admin.");
            return;
        }

        if (!userEmail) {
            alert("A valid email is required for payment. Please update your profile.");
            return;
        }

        const config = {
            key: platformPublicKey,
            email: userEmail,
            amount: Math.round(priceGHS * 100), // convert to pesewas
            currency: "GHS",
            reference: `${type}_${Date.now()}`,
            metadata: {
                custom_fields: [
                    { display_name: "Item", variable_name: "item", value: label },
                    { display_name: "Type", variable_name: "type", value: type },
                    { display_name: "Amount", variable_name: "amount", value: amount }
                ]
            }
        };

        const PaystackPop = (window as any).PaystackPop;
        if (!PaystackPop) {
            alert("Payment system not loaded. Please refresh.");
            return;
        }

        const handler = PaystackPop.setup({
            ...config,
            callback: (response: any) => handlePaymentSuccess(response.reference, amount, priceGHS, type),
            onClose: () => setIsPurchasing(false)
        });
        handler.openIframe();
    };

    const handlePurchaseGilt = (amount: number, priceGHS: number, label: string) => {
        if (!user) return;
        startPaystackPayment(amount, priceGHS, 'gilt', label);
    };

    const handlePurchaseInklets = (amount: number, priceGHS: number, label: string) => {
        if (!user) return;
        startPaystackPayment(amount, priceGHS, 'inklets', label);
    };

    const handleSubscribe = (tier: SubscriptionTier, priceGHS: number, label: string) => {
        if (!user) return;
        // For subscriptions, 'amount' is treated as a flag or 1, since the tier is in the metadata
        startPaystackPayment(1, priceGHS, `sub_${tier}`, label);
    };

    const handlePurchaseVellux = async (tier: VelluxTier) => {
        // Vellux is still mock or needs its own logic, leaving as is for now but fixing the syntax
        if (!user) return;
        setIsPurchasing(true);
        try {
            const success = await purchaseVellux(user.uid, tier);
            if (success) setShowOptions(false);
            else alert("Vellux purchase failed.");
        } catch (error) {
            console.error(error);
        } finally {
            setIsPurchasing(false);
        }
    };

    const giltOptions = [
        { amount: 10, priceGHS: 2, label: "Touch of Gilt" },
        { amount: 50, priceGHS: 10, label: "Vein of Gilt" },
        { amount: 250, priceGHS: 50, label: "Gilt Bar" },
    ];

    const subOptions = [
        { tier: 'prime' as SubscriptionTier, priceGHS: 5, label: "Vellum Prime", displayPrice: "GHS 5/week" },
        { tier: 'nexus' as SubscriptionTier, priceGHS: 20, label: "Vellum Nexus", displayPrice: "GHS 20/month" },
    ];

    const inkletOptions = [
        { amount: 100, priceGHS: 5, label: "Pouch of Inklets" },
        { amount: 500, priceGHS: 20, label: "Chest of Inklets" },
        { amount: 1200, priceGHS: 45, label: "Coffer of Inklets" },
    ];

    const velluxOptions = [
        { tier: 'gold' as VelluxTier, price: "GHS 50", label: "Gold Vellux" },
        { tier: 'diamond' as VelluxTier, price: "GHS 100", label: "Diamond Vellux" },
        { tier: 'platinum' as VelluxTier, price: "GHS 250", label: "Platinum Vellux" },
    ];

    if (!user) return null;

    return (
        <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 space-y-12 bg-white/[0.01] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 flex-1">
                    <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black italic">Gilt</p>
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#facc15] animate-pulse" />
                            </div>
                            <span className="text-4xl font-black text-white italic tracking-tighter">
                                {monetization?.giltBalance.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black italic">Inklets</p>
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa] animate-pulse" />
                            </div>
                            <span className="text-4xl font-black text-white italic tracking-tighter">
                                {monetization?.inkletWallet?.balance.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black italic">Echoes</p>
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#fbbf24] animate-pulse" />
                            </div>
                            <span className="text-4xl font-black text-white italic tracking-tighter">
                                {monetization?.velluxWallets.reduce((acc, w) => acc + w.amount, 0) || 0}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black italic">Standing</p>
                        <div className="flex items-center gap-4">
                            <span className="px-4 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-black text-white uppercase tracking-widest italic shadow-lg">
                                {monetization?.subscriptionTier || 'Seeker'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="px-10 py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.3)] italic whitespace-nowrap self-center md:self-start"
                >
                    {showOptions ? "Close Vault" : "Manifest Gilt"}
                </button>
            </div>

            {showOptions && (
                <div className="space-y-16 pt-8 animate-in fade-in slide-in-from-top-6 duration-700 overflow-y-auto max-h-[60vh] pr-6 custom-scrollbar relative z-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <p className="text-[10px] uppercase tracking-[0.5em] text-[var(--reader-accent)] font-black italic">Subscriptions</p>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {subOptions.map((opt) => (
                                <button
                                    key={opt.tier}
                                    disabled={isPurchasing || monetization?.subscriptionTier === opt.tier}
                                    onClick={() => handleSubscribe(opt.tier, opt.priceGHS, opt.label)}
                                    className={`p-8 rounded-3xl border transition-all text-left space-y-4 group relative overflow-hidden ${
                                        monetization?.subscriptionTier === opt.tier 
                                        ? 'border-emerald-500/30 bg-emerald-500/5 cursor-default' 
                                        : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-[var(--reader-accent)]/30'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black group-hover:text-[var(--reader-accent)] transition-colors italic">{opt.label}</p>
                                        {monetization?.subscriptionTier === opt.tier && (
                                            <span className="text-[10px] uppercase font-black text-emerald-400 tracking-[0.2em] italic bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Active</span>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-3xl font-black text-white italic tracking-tighter leading-none">
                                            {opt.tier === 'prime' ? 'The Prime' : 'The Nexus'}
                                        </p>
                                        <p className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.2em] italic">{opt.displayPrice}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <p className="text-[10px] uppercase tracking-[0.5em] text-amber-400/60 font-black italic">Gilt Bundles</p>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {giltOptions.map((opt) => (
                                <button
                                    key={opt.amount}
                                    disabled={isPurchasing}
                                    onClick={() => handlePurchaseGilt(opt.amount, opt.priceGHS, opt.label)}
                                    className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-amber-500/30 transition-all text-left space-y-4 group relative overflow-hidden"
                                >
                                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black group-hover:text-amber-400 transition-colors italic">{opt.label}</p>
                                    <div className="space-y-1">
                                        <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{opt.amount} Gilt</p>
                                        <p className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.2em] italic">GHS {opt.priceGHS}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <p className="text-[10px] uppercase tracking-[0.5em] text-blue-400/60 font-black italic">Inklet Bundles</p>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {inkletOptions.map((opt) => (
                                <button
                                    key={opt.amount}
                                    disabled={isPurchasing}
                                    onClick={() => handlePurchaseInklets(opt.amount, opt.priceGHS, opt.label)}
                                    className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-blue-500/30 transition-all text-left space-y-4 group relative overflow-hidden"
                                >
                                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black group-hover:text-blue-400 transition-colors italic">{opt.label}</p>
                                    <div className="space-y-1">
                                        <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{opt.amount} Inklets</p>
                                        <p className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.2em] italic">GHS {opt.priceGHS}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isPurchasing && (
                <div className="text-center py-8 text-[10px] uppercase tracking-[0.5em] text-[var(--reader-accent)] font-black italic animate-pulse">
                    Manifesting Transaction...
                </div>
            )}
        </div>
    );
}
