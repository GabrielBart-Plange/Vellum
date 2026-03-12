"use client";

import { ArtPiece } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { progressTracking } from "@/lib/progressTracking";
import { useState } from "react";
import Image from "next/image";

import ArtComments from "./ArtComments";

interface ArtCardProps {
    art: ArtPiece;
    isSavedInitially?: boolean;
    isRepostedInitially?: boolean;
}

export default function ArtCard({ art, isSavedInitially = false, isRepostedInitially = false }: ArtCardProps) {
    const { user, monetization } = useAuth();
    const [isSaved, setIsSaved] = useState(isSavedInitially);
    const [isReposted, setIsReposted] = useState(isRepostedInitially);
    const [showComments, setShowComments] = useState(false);
    const [loading, setLoading] = useState(false);

    const isPremium = monetization?.subscriptionTier === 'prime' || monetization?.subscriptionTier === 'nexus';

    const handleSave = async () => {
        if (!user) return alert("Sign in to save artifacts.");
        if (!isPremium) return alert("Vellum Prime required to save artifacts.");

        setLoading(true);
        try {
            if (isSaved) {
                await progressTracking.unsaveArtPiece(user.uid, art.id);
                setIsSaved(false);
            } else {
                await progressTracking.saveArtPiece(user.uid, art);
                setIsSaved(true);
            }
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRepost = async () => {
        if (!user) return alert("Sign in to repost.");
        if (!isPremium) return alert("Vellum Prime required to repost.");

        setLoading(true);
        try {
            if (isReposted) {
                await progressTracking.undoRepostArtPiece(user.uid, art.id);
                setIsReposted(false);
            } else {
                await progressTracking.repostArtPiece(user.uid, art);
                setIsReposted(true);
            }
        } catch (error) {
            console.error("Repost error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="group glass-panel rounded-3xl overflow-hidden hover:border-white/10 transition-all flex flex-col">
            <div className="relative aspect-[4/5] overflow-hidden bg-zinc-900">
                <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 grayscale-[0.3] group-hover:grayscale-0"
                    onError={(e) => (e.currentTarget.src = "https://placehold.co/400x500/1a1a1a/666666?text=Image+Not+Found")}
                />

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 gap-4">
                    <div className="flex gap-3">
                        <button
                            onClick={(e) => { e.preventDefault(); handleSave(); }}
                            disabled={loading}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSaved
                                    ? "bg-white text-black"
                                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                                }`}
                        >
                            {isSaved ? "Saved" : "Save"}
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); handleRepost(); }}
                            disabled={loading}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${isReposted
                                    ? "bg-purple-600 text-white"
                                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                                }`}
                            title="Repost to your profile"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-6 space-y-4 flex-1">
                <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">{art.authorName || "Unknown Archivist"}</p>
                    <div className="flex justify-between items-start gap-4">
                        <h3 className="text-lg font-light text-white tracking-wide">{art.title}</h3>
                        <div className="flex gap-4">
                            {art.saveCount !== undefined && (
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-black">S</span>
                                    <span className="text-[10px] text-white font-bold">{art.saveCount}</span>
                                </div>
                            )}
                            {art.repostCount !== undefined && (
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-black">R</span>
                                    <span className="text-[10px] text-white font-bold">{art.repostCount}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {art.description && (
                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-light italic">
                            {art.description}
                        </p>
                    )}
                </div>

                <div className="pt-4 border-t border-white/5">
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="text-[10px] uppercase tracking-widest text-zinc-400 font-black hover:text-white transition-colors"
                    >
                        {showComments ? "Hide Echoes" : "View Echoes"}
                    </button>

                    {showComments && (
                        <div className="mt-8">
                            <ArtComments artId={art.id} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
