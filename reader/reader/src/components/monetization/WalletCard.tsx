"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { purchaseVellux, verifyPaystackPayment } from "@/lib/monetization/coinService";
import { paymentFactory } from "@/lib/monetization/paymentFactory";
import { VelluxTier, SubscriptionTier } from "@/types";

export default function WalletCard() {
    const { user, monetization } = useAuth();
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [checkInReward, setCheckInReward] = useState<number | null>(null);
    const [showOptions, setShowOptions] = useState(false);
    const [preferredProvider, setPreferredProvider] = useState<'lemonsqueezy' | 'paystack'>('paystack');
    const [copied, setCopied] = useState(false);

    const hasCheckedInToday = (monetization as any)?.lastCheckIn === new Date().toISOString().split('T')[0];

    // Note: Geolocation routing temporarily disabled pending Lemon Squeezy KYC validation.
    // All traffic routed through Paystack logic natively.


    const handlePaymentSuccess = async (reference: string, amount: number, priceGHS: number, type: string) => {
        setIsPurchasing(true);
        try {
            const success = await verifyPaystackPayment(reference, user!.uid, amount, priceGHS, type);
            if (success) {
                // Success feedback
                setIsSuccess(true);
                setTimeout(() => {
                    setIsSuccess(false);
                    setShowOptions(false);
                }, 3000);
            } else {
                console.error("Paystack verification failed for reference:", reference);
            }
        } catch (error) {
            console.error("Payment success callback error:", error);
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleDailyCheckIn = async () => {
        if (!user || hasCheckedInToday || isCheckingIn) return;
        
        setIsCheckingIn(true);
        try {
            const response = await fetch('/api/rewards/daily-checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid })
            });
            
            const result = await response.json();
            if (result.ok) {
                setCheckInReward(result.reward);
                setIsSuccess(true);
                setTimeout(() => {
                    setIsSuccess(false);
                    setCheckInReward(null);
                }, 3000);
            } else if (!result.alreadyDone) {
                console.error("Check-in failed:", result.error);
            }
        } catch (error) {
            console.error("Check-in error:", error);
        } finally {
            setIsCheckingIn(false);
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
                userId: user.uid,
                custom_fields: [
                    { display_name: "Item", variable_name: "item", value: label },
                    { display_name: "Type", variable_name: "type", value: type },
                    { display_name: "Amount", variable_name: "amount", value: amount },
                    { display_name: "User ID", variable_name: "userId", value: user.uid }
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

    const handlePurchaseInklets = async (amount: number, priceGHS: number, label: string, packageId?: string) => {
        if (!user) return;
        
        if (preferredProvider === 'lemonsqueezy' && packageId) {
            setIsPurchasing(true);
            try {
                const result = await paymentFactory.initiateInkletPurchase({
                    userId: user.uid,
                    userEmail: user.email || "",
                    amount,
                    packageId,
                    provider: 'lemonsqueezy'
                });
                if (result.type === 'url' && result.url) {
                    window.location.href = result.url;
                }
            } catch (error) {
                console.error("LemonSqueezy purchase error:", error);
                alert("Could not initiate global checkout. Trying local option...");
                startPaystackPayment(amount, priceGHS, 'inklets', label);
            } finally {
                setIsPurchasing(false);
            }
        } else {
            startPaystackPayment(amount, priceGHS, 'inklets', label);
        }
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
        { tier: 'plus' as SubscriptionTier, priceGHS: 10, label: "Vellum Plus", displayPrice: "GHS 10/week" },
        { tier: 'pro' as SubscriptionTier, priceGHS: 30, label: "Vellum Pro", displayPrice: "GHS 30/month" },
    ];

    const inkletOptions = [
        { amount: 100, priceGHS: 2, label: "Pouch of Inklets", packageId: "variant_pouch_100" },
        { amount: 500, priceGHS: 10, label: "Chest of Inklets", packageId: "variant_chest_500" },
        { amount: 1200, priceGHS: 20, label: "Coffer of Inklets", packageId: "variant_coffer_1200" },
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
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black italic">Vellux</p>
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
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 self-center md:self-start w-full sm:w-auto mt-6 md:mt-0">
                    {!hasCheckedInToday && (
                        <button
                            onClick={handleDailyCheckIn}
                            disabled={isCheckingIn}
                            className="px-6 md:px-8 py-3 md:py-4 bg-blue-600 text-white text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] rounded-2xl hover:bg-blue-500 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(59,130,246,0.3)] italic whitespace-nowrap w-full sm:w-auto"
                        >
                            {isCheckingIn ? "Communing..." : "Daily Gift"}
                        </button>
                    )}
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="px-6 md:px-10 py-3 md:py-4 bg-white text-black text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.3)] italic whitespace-nowrap w-full sm:w-auto"
                    >
                        {showOptions ? "Close Vault" : "Manifest Gilt"}
                    </button>
                </div>
            </div>

            {showOptions && (
                <div className="space-y-16 pt-8 animate-in fade-in slide-in-from-top-6 duration-700 overflow-y-auto max-h-[60vh] pr-6 custom-scrollbar relative z-10">
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[var(--reader-accent)] animate-pulse" />
                            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 italic">Vellum Exchange Ratio</p>
                        </div>
                        <p className="text-xs font-black text-white italic tracking-tighter">1 Gilt = 10 Inklets</p>
                    </div>

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
                                            {opt.tier === 'plus' ? 'The Plus' : 'The Pro'}
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
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <p className="text-[10px] uppercase tracking-[0.5em] text-blue-400/60 font-black italic">Inklet Bundles</p>
                                <div className="h-px w-24 bg-white/5" />
                            </div>
                            
                            {/* Lemon Squeezy vs Paystack Toggle Temporarily Removed for Launch */}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {inkletOptions.map((opt) => (
                                <button
                                    key={opt.amount}
                                    disabled={isPurchasing}
                                    onClick={() => handlePurchaseInklets(opt.amount, opt.priceGHS, opt.label, opt.packageId)}
                                    className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-blue-500/30 transition-all text-left space-y-4 group relative overflow-hidden"
                                >
                                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black group-hover:text-blue-400 transition-colors italic">{opt.label}</p>
                                    <div className="space-y-1">
                                        <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{opt.amount} Inklets</p>
                                        <p className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.2em] italic">
                                            {preferredProvider === 'lemonsqueezy' ? `$${(opt.priceGHS / 12).toFixed(2)}` : `GHS ${opt.priceGHS}`}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <p className="text-[10px] uppercase tracking-[0.5em] text-indigo-400/60 font-black italic">Manifestation Missions</p>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { 
                                    title: "Daily Resonance", 
                                    desc: "Manifest your daily gift from the Archives.", 
                                    reward: "3 Inklets", 
                                    done: hasCheckedInToday,
                                    action: handleDailyCheckIn,
                                    loading: isCheckingIn
                                },
                                { 
                                    title: "Seeker's Induction", 
                                    desc: "Invite a fellow chronicler via your link.", 
                                    reward: "50 Inklets", 
                                    done: false,
                                    link: "#referral-section"
                                },
                                { 
                                    title: "Deep Immersive", 
                                    desc: "Read 5 units in a single cycle.", 
                                    reward: "20 Inklets", 
                                    done: false 
                                },
                                { 
                                    title: "Echo of Insight", 
                                    desc: "Leave a resonance (comment) on any unit.", 
                                    reward: "5 Inklets", 
                                    done: false 
                                }
                            ].map((m, i) => (
                                <div 
                                    key={i} 
                                    className={`p-6 rounded-2xl border transition-all ${m.done ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-white/[0.02] border-white/5 hover:border-indigo-500/30'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={`text-[11px] font-black uppercase italic tracking-widest ${m.done ? 'text-emerald-400' : 'text-white'}`}>{m.title}</h4>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${m.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                            {m.done ? "Manifested" : m.reward}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-tight mb-4">{m.desc}</p>
                                    {!m.done && (
                                        m.action ? (
                                            <button 
                                                onClick={m.action} 
                                                disabled={m.loading}
                                                className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-white transition-colors"
                                            >
                                                {m.loading ? "Communing..." : "Execute Ritual"}
                                            </button>
                                        ) : (
                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-700 italic">Progress Tracking...</p>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Refer & Earn (The Archivist's Echo) */}
                    <div id="referral-section" className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-6 relative overflow-hidden group/refer">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover/refer:opacity-[0.1] transition-opacity pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="16" x2="22" y1="11" y2="11"/></svg>
                        </div>
                        
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-[0.5em] text-indigo-400 font-black italic">The Archivist's Echo</p>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Refer & Earn</h3>
                            <p className="text-[11px] text-zinc-500 max-w-md leading-relaxed italic">
                                Invite fellow seekers to the archives. When they sign up using your link, you manifest <span className="text-white font-black italic">50 Inklets</span> to your coffer.
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 flex items-center gap-3 bg-black/40 border border-white/5 p-3 rounded-2xl">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">ID:</span>
                                <code className="flex-1 text-xs font-black text-indigo-300 tracking-tighter">{(monetization as any)?.referralId || "ARC-XXXXXX"}</code>
                                <button 
                                    onClick={() => {
                                        const link = `${window.location.origin}?ref=${(monetization as any)?.referralId || "VELLUM"}`;
                                        navigator.clipboard.writeText(link);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest transition-all text-indigo-400"
                                >
                                    {copied ? "Copied" : "Copy Link"}
                                </button>
                            </div>
                            
                        <button 
                                onClick={() => {
                                    const link = `${window.location.origin}?ref=${(monetization as any)?.referralId || "VELLUM"}`;
                                    const text = `Join me in the Vellum archives! Use my link to get 50 bonus Inklets: ${link}`;
                                    if (navigator.share) {
                                        navigator.share({ title: "Vellum", text, url: link });
                                    } else {
                                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                    }
                                }}
                                className="px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-500 transition-all shadow-lg italic"
                            >
                                Easy Share
                            </button>
                        </div>
                        
                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest italic pt-2">
                           Reward Limit: {monetization?.subscriptionTier === 'pro' ? '50' : monetization?.subscriptionTier === 'plus' ? '25' : '10'} Successful Inductions ({(monetization as any)?.referralCount || 0}/{monetization?.subscriptionTier === 'pro' ? '50' : monetization?.subscriptionTier === 'plus' ? '25' : '10'})
                        </p>

                        {/* Milestone Tracker (Complement) */}
                        {monetization?.subscriptionTier !== 'pro' && (
                            <div className="mt-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest italic">
                                    <span className="text-zinc-500">Next Milestone: {monetization?.subscriptionTier === 'free' ? 'Plus (25)' : 'Pro (50)'}</span>
                                    <span className="text-indigo-400">{(monetization as any)?.referralCount || 0} / {monetization?.subscriptionTier === 'free' ? '25' : '50'}</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 transition-all duration-1000" 
                                        style={{ width: `${Math.min((((monetization as any)?.referralCount || 0) / (monetization?.subscriptionTier === 'free' ? 25 : 50)) * 100, 100)}%` }} 
                                    />
                                </div>
                                <p className="text-[7px] text-zinc-600 font-bold italic uppercase tracking-tighter">Upgrade to {monetization?.subscriptionTier === 'free' ? 'Plus' : 'Pro'} to expand your influence even further.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isPurchasing && (
                <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in duration-500">
                    <div className="w-16 h-16 rounded-full border-t-2 border-[var(--reader-accent)] animate-spin shadow-[0_0_30px_rgba(139,92,246,0.3)]" />
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.6em] text-[var(--reader-accent)] font-black italic animate-pulse">Manifesting Transaction</p>
                        <p className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold">Synchronizing your coffers with the Vellum Archives...</p>
                    </div>
                </div>
            )}

            {isSuccess && (
                <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.6em] text-emerald-400 font-black italic">Manifestation Complete</p>
                        {checkInReward ? (
                            <p className="text-white text-lg font-black italic tracking-tighter">+{checkInReward} Inklets</p>
                        ) : (
                            <p className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold">The Archives have been updated with your contribution.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
