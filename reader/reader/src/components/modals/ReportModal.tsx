"use client";

import { useState } from "react";
import { X, Flag, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentType: 'novel' | 'story' | 'chapter' | 'comment' | 'user';
    contentId: string;
    contentTitle?: string;
    authorId?: string;
}

const REPORT_REASONS = [
    "Spam or misleading",
    "Harassment or hate speech",
    "Inappropriate sexual content",
    "Graphic violence",
    "Intellectual property violation",
    "Self-harm or suicide",
    "Other"
];

export default function ReportModal({ isOpen, onClose, contentType, contentId, contentTitle, authorId }: ReportModalProps) {
    const { user } = useAuth();
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [submitting, setUnlocking] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) return;

        setUnlocking(true);
        try {
            const response = await fetch('/api/moderation/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporterId: user?.uid || "anonymous",
                    reporterEmail: user?.email || "anonymous",
                    contentType,
                    contentId,
                    contentTitle: contentTitle || "Untitled",
                    authorId: authorId || "unknown",
                    reason,
                    details
                })
            });

            const result = await response.json();
            if (result.ok) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    onClose();
                    setReason("");
                    setDetails("");
                }, 2500);
            } else {
                throw new Error(result.error || "Report submission failed");
            }
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("Failed to submit report. Please try again.");
        } finally {
            setUnlocking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-[#0b0a0f] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <Flag size={18} className="text-red-500" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase tracking-[0.4em] text-red-500 font-black italic">Security Protocol</p>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Report Content</h3>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="py-12 text-center space-y-6 animate-in zoom-in duration-500">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                                <Shield size={40} className="text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-[0.6em] text-emerald-400 font-black italic">Transmission Received</p>
                                <p className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold max-w-xs mx-auto">
                                    The Scribes have been alerted. Your report is being processed in the shadows.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black italic">
                                    Reason for Report
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {REPORT_REASONS.map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setReason(r)}
                                            className={`w-full text-left px-5 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                                reason === r 
                                                ? 'bg-red-500/10 border-red-500/40 text-red-400' 
                                                : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20 hover:text-white'
                                            }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black italic">
                                    Additional Context
                                </label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Provide more information to help our moderators..."
                                    className="w-full bg-white/[0.03] border border-white/5 p-5 text-white focus:outline-none focus:border-red-500/40 transition-all h-32 resize-none text-xs rounded-2xl font-black italic placeholder:text-zinc-800"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!reason || submitting}
                                className="w-full py-4 rounded-2xl bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.3em] hover:bg-red-500 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:grayscale italic"
                            >
                                {submitting ? "Transmitting..." : "Submit Report"}
                            </button>
                        </form>
                    )}
                </div>

                <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
                    <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-black italic">
                        Misuse of the reporting system may lead to archival restriction.
                    </p>
                </div>
            </div>
        </div>
    );
}
