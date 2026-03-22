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
        <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-12 bg-zinc-900/20">
            <div className="flex justify-between items-start">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Gilt</p>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                                <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_10px_#facc15]" />
                            </div>
                            <span className="text-3xl font-black text-white italic tracking-tighter">
                                {monetization?.giltBalance.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Inklets</p>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />
                            </div>
                            <span className="text-3xl font-black text-white italic tracking-tighter">
                                {monetization?.inkletWallet?.balance.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Vellux</p>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
                            </div>
                            <span className="text-3xl font-black text-white italic tracking-tighter">
                                {monetization?.velluxWallets.reduce((acc, w) => acc + w.amount, 0) || 0}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Tier</p>
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-black text-zinc-400 uppercase tracking-widest border border-white/10 px-3 py-1 rounded-lg">
                                {monetization?.subscriptionTier || 'Free'}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform whitespace-nowrap"
                >
                    {showOptions ? "Cancel" : "Purchase"}
                </button>
            </div>

            {showOptions && (
                <div className="space-y-12 pt-4 animate-in fade-in slide-in-from-top-4 overflow-y-auto max-h-[60vh] pr-4">
                    <div className="space-y-4">
                        <p className="text-[10px] uppercase tracking-widest text-[var(--reader-heading)] font-black">Subscriptions (Vellum Chronicles)</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subOptions.map((opt) => (
                                <button
                                    key={opt.tier}
                                    disabled={isPurchasing || monetization?.subscriptionTier === opt.tier}
                                    onClick={() => handleSubscribe(opt.tier, opt.priceGHS, opt.label)}
                                    className={`p-6 rounded-2xl border transition-all text-left space-y-2 group ${
                                        monetization?.subscriptionTier === opt.tier 
                                        ? 'border-green-500/50 bg-green-500/10 cursor-default' 
                                        : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-purple-500/30'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold group-hover:text-purple-400">{opt.label}</p>
                                        {monetization?.subscriptionTier === opt.tier && (
                                            <span className="text-[8px] uppercase font-black text-green-400 tracking-tighter">Active</span>
                                        )}
                                    </div>
                                    <p className="text-xl font-black text-white italic lowercase tracking-tighter">
                                        {opt.tier === 'prime' ? 'Prime' : 'Nexus'}
                                    </p>
                                    <p className="text-[10px] text-zinc-400">{opt.displayPrice}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] uppercase tracking-widest text-[#facc15] font-black italic">Gilt Bundles (Premium Currency)</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {giltOptions.map((opt) => (
                                <button
                                    key={opt.amount}
                                    disabled={isPurchasing}
                                    onClick={() => handlePurchaseGilt(opt.amount, opt.priceGHS, opt.label)}
                                    className="p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-yellow-500/30 transition-all text-left space-y-2 group"
                                >
                                    <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold group-hover:text-yellow-400">{opt.label}</p>
                                    <p className="text-xl font-black text-white">{opt.amount} Gilt</p>
                                    <p className="text-[10px] text-zinc-400">GHS {opt.priceGHS}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Inklet Bundles (Daily Rewards)</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {inkletOptions.map((opt) => (
                                <button
                                    key={opt.amount}
                                    disabled={isPurchasing}
                                    onClick={() => handlePurchaseInklets(opt.amount, opt.priceGHS, opt.label)}
                                    className="p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all text-left space-y-2 group"
                                >
                                    <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold group-hover:text-blue-400">{opt.label}</p>
                                    <p className="text-xl font-black text-white">{opt.amount} Inklets</p>
                                    <p className="text-[10px] text-zinc-400">GHS {opt.priceGHS}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isPurchasing && (
                <div className="text-center py-4 text-[10px] uppercase tracking-[0.3em] text-purple-500 font-bold animate-pulse">
                    Processing Transaction...
                </div>
            )}
        </div>
    );
}
