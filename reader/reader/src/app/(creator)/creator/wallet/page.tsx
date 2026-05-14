"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { Wallet, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowRight, ChevronRight } from "lucide-react";

const PAYOUT_THRESHOLD_GHS = 200;
const GILT_TO_GHS = 0.20;

interface PayoutRequest {
  id: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  requestedAt: Timestamp;
}

interface WalletData {
  payoutBalance: number;
  lifetimeGiltEarned: number;
  lifetimeVelluxReceived: number;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { setLoading(false); return; }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setWallet({
            payoutBalance: data.payoutBalance ?? 0,
            lifetimeGiltEarned: data.lifetimeGiltEarned ?? 0,
            lifetimeVelluxReceived: data.lifetimeVelluxReceived ?? 0,
          });
        }

        // Fetch payout history
        const requestsRef = collection(db, "payout_requests");
        const q = query(requestsRef, where("authorId", "==", user.uid), orderBy("requestedAt", "desc"));
        try {
          const snap = await getDocs(q);
          setPayoutHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as PayoutRequest)));
        } catch {
          // Index may not exist yet — benign
        }
      } catch (err) {
        console.error("Wallet fetch error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const requestWithdrawal = async () => {
    if (!wallet || wallet.payoutBalance < PAYOUT_THRESHOLD_GHS) return;
    setRequesting(true);
    setError(null);
    setSuccess(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const resp = await fetch("/api/creator/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await resp.json();

      if (data.ok) {
        setSuccess("Withdrawal request submitted. You will be contacted within 30 days.");
        // Optimistically reset balance in state
        setWallet(w => w ? { ...w, payoutBalance: 0 } : w);
      } else {
        setError(data.error || "Failed to submit request. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setRequesting(false);
    }
  };

  const thresholdProgress = wallet ? Math.min((wallet.payoutBalance / PAYOUT_THRESHOLD_GHS) * 100, 100) : 0;
  const isEligible = (wallet?.payoutBalance ?? 0) >= PAYOUT_THRESHOLD_GHS;
  const hasPendingRequest = payoutHistory.some(p => p.status === "pending");

  const statusColor = (status: PayoutRequest["status"]) => {
    if (status === "paid") return "text-emerald-400";
    if (status === "approved") return "text-blue-400";
    if (status === "rejected") return "text-red-400";
    return "text-amber-400";
  };

  const statusIcon = (status: PayoutRequest["status"]) => {
    if (status === "paid" || status === "approved") return <CheckCircle size={12} />;
    if (status === "rejected") return <AlertCircle size={12} />;
    return <Clock size={12} />;
  };

  return (
    <section className="space-y-16">
      <header className="space-y-4">
        <h1 className="text-4xl tracking-[0.3em] font-light uppercase text-[var(--foreground)]">
          My Wallet
        </h1>
        <p className="text-[var(--reader-text)]/50 max-w-lg leading-relaxed text-sm">
          Track your earnings from tips, chapter unlocks, and Vellux support. Withdrawals are processed
          manually within <span className="text-[var(--accent-sakura)] italic">30 days</span> of request.
        </p>
      </header>

      {/* Balance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-10 rounded-[2.5rem] border-[var(--reader-border)] bg-gradient-to-br from-white/[0.03] to-transparent relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-[var(--accent-sakura)]/5 blur-3xl rounded-full" />
          <div className="relative space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-sakura)]/10 flex items-center justify-center">
                <Wallet size={18} className="text-[var(--accent-sakura)]" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent-sakura)] font-bold">
                Pending Balance
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-extralight tracking-tighter text-white">
                  {loading ? "—" : `GHS ${(wallet?.payoutBalance ?? 0).toFixed(2)}`}
                </span>
              </div>
              <p className="text-xs text-[var(--reader-text)]/40 font-light">
                Available for withdrawal when you reach the GHS {PAYOUT_THRESHOLD_GHS}.00 threshold
              </p>
            </div>

            {/* Threshold Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--reader-text-muted)] font-bold">
                  Threshold Progress
                </span>
                <span className="text-[10px] font-bold text-[var(--reader-text-muted)]">
                  {loading ? "—" : `${thresholdProgress.toFixed(0)}%`}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${thresholdProgress}%`,
                    background: isEligible
                      ? "linear-gradient(90deg, #a3e635, #84cc16)"
                      : "linear-gradient(90deg, var(--accent-sakura), #f472b6)",
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-[var(--reader-text)]/30 font-mono">
                <span>GHS 0.00</span>
                <span>GHS {PAYOUT_THRESHOLD_GHS}.00</span>
              </div>
            </div>

            {/* Withdrawal Action */}
            {success && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3">
                <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {hasPendingRequest ? (
              <div className="flex items-center gap-3 text-amber-400 text-xs">
                <Clock size={14} />
                <span>You have a pending withdrawal request under review.</span>
              </div>
            ) : (
              <button
                onClick={requestWithdrawal}
                disabled={!isEligible || requesting || loading}
                className="flex items-center gap-3 px-8 py-4 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: isEligible
                    ? "linear-gradient(135deg, var(--accent-lime), #84cc16)"
                    : "transparent",
                  border: isEligible ? "none" : "1px solid var(--reader-border)",
                  color: isEligible ? "#000" : "var(--reader-text-muted)",
                  boxShadow: isEligible ? "0 0 30px -5px var(--glow-lime)" : "none",
                }}
              >
                {requesting ? "Submitting..." : "Request Withdrawal"}
                {!requesting && <ArrowRight size={12} />}
              </button>
            )}
          </div>
        </div>

        {/* Lifetime Stats */}
        <div className="space-y-4">
          <div className="glass-panel p-7 rounded-2xl space-y-3 group">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent-sakura)]/60 font-bold">Gilt Earned (All Time)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-white">
                {loading ? "—" : (wallet?.lifetimeGiltEarned ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-[var(--reader-text-muted)] uppercase tracking-widest font-bold italic">Gilt</span>
            </div>
            <p className="text-[10px] text-[var(--reader-text)]/30">
              ≈ GHS {loading ? "—" : ((wallet?.lifetimeGiltEarned ?? 0) * GILT_TO_GHS * 0.7).toFixed(2)} author share
            </p>
          </div>

          <div className="glass-panel p-7 rounded-2xl space-y-3 group">
            <div className="flex items-center gap-2">
              <TrendingUp size={12} className="text-[var(--accent-lime)]/60" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent-lime)]/60 font-bold">Vellux Support</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-white">
                {loading ? "—" : (wallet?.lifetimeVelluxReceived ?? 0)}
              </span>
              <span className="text-[10px] text-[var(--reader-text-muted)] uppercase tracking-widest font-bold italic">Tokens</span>
            </div>
            <p className="text-[10px] text-[var(--reader-text)]/30">Premium reader support received</p>
          </div>

          <div className="glass-panel p-7 rounded-2xl space-y-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500/60 font-bold">Min. Threshold</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-white">GHS 200</span>
            </div>
            <p className="text-[10px] text-[var(--reader-text)]/30">Net-30 manual payout schedule</p>
          </div>
        </div>
      </div>

      {/* Payout History */}
      <div className="space-y-8">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text-subtle)] font-bold flex items-center gap-4">
          <span className="flex-shrink-0 flex items-center gap-2">
            <Clock size={14} className="text-[var(--reader-text-subtle)]" />
            Withdrawal History
          </span>
          <div className="h-[1px] w-full bg-[var(--reader-border)]" />
        </h2>

        {loading ? (
          <div className="text-center py-16 text-[var(--reader-text)]/30 text-sm">Loading...</div>
        ) : payoutHistory.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
              <Wallet size={20} className="text-[var(--reader-text-muted)]" />
            </div>
            <div>
              <p className="text-sm font-light text-[var(--reader-text)]/50">No withdrawal requests yet</p>
              <p className="text-xs text-[var(--reader-text)]/30 mt-1">
                Reach GHS 200 in your pending balance to submit your first request.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {payoutHistory.map((req) => (
              <div key={req.id} className="glass-panel p-6 rounded-2xl flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] ${statusColor(req.status)}`}>
                    {statusIcon(req.status)}
                    {req.status}
                  </div>
                  <p className="text-xs text-[var(--reader-text)]/40">
                    {req.requestedAt?.toDate().toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-light text-white">
                    GHS {req.amount.toFixed(2)}
                  </span>
                  <ChevronRight size={14} className="text-[var(--reader-text)]/20 group-hover:text-[var(--reader-text)]/40 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <footer>
        <div className="p-8 rounded-3xl bg-[var(--reader-surface)] border border-[var(--reader-border)] space-y-3 max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--reader-text-muted)] font-bold">How It Works</p>
          <ul className="text-xs text-[var(--reader-text)]/40 leading-relaxed font-light space-y-1.5">
            <li>• Gilt tips and chapter unlocks earn you <span className="text-white/60">70% of the GHS value</span></li>
            <li>• Vellux support tokens earn you <span className="text-white/60">30% of the token's GHS value</span></li>
            <li>• Inklet earnings are platform revenue and are not withdrawable</li>
            <li>• Withdrawals are sent to your registered mobile money account within <span className="text-white/60">30 days</span></li>
          </ul>
        </div>
      </footer>
    </section>
  );
}
