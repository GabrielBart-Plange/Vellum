"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Zap, Heart, TrendingUp, Users, Sparkles } from "lucide-react";

interface Activity {
    id: string;
    type: string;
    userId: string;
    amount?: number;
    createdAt: Timestamp;
    refereeId?: string;
    novelId?: string;
    target?: string;
}

export default function GlobalActivityTicker() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const q = query(
            collection(db, "global_activity"),
            orderBy("timestamp", "desc"),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const results: Activity[] = [];
            snap.forEach((doc) => {
                const data = doc.data();
                results.push({ 
                    id: doc.id, 
                    ...data,
                    createdAt: data.timestamp // Map timestamp to createdAt for compatibility
                } as Activity);
            });
            setActivities(results);
        }, (error) => {
            console.error("Ticker Listener Error:", error);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (activities.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activities.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [activities]);

    if (activities.length === 0) return null;

    const current = activities[currentIndex];

    const getMessage = (activity: Activity) => {
        switch (activity.type) {
            case 'referral_reward':
                return "A new Seeker has joined the archives via referral!";
            case 'unlock_chapter':
                return `An archival unit was just manifested in "${activity.target || 'a new chronicle'}".`;
            case 'unlock_story':
                return `A full chronicle "${activity.target}" has been unlocked.`;
            case 'vellux_purchase':
                return "A Vellux token of influence has been acquired.";
            case 'tip':
                return `A chronicler received a token of appreciation for "${activity.target}".`;
            case 'comment':
                return `An echo has been left on "${activity.target}".`;
            case 'like':
                return `A resonance of like has been felt for "${activity.target}".`;
            case 'level_up':
                return `A Seeker has ascended to Level ${activity.amount || 'next'}!`;
            default:
                return "The archives are resonating with new activity.";
        }
    };

    const getIcon = (activity: Activity) => {
        switch (activity.type) {
            case 'referral_reward': return <Users size={12} className="text-blue-400" />;
            case 'vellux_purchase': return <Zap size={12} className="text-amber-400" />;
            case 'unlock_chapter': return <TrendingUp size={12} className="text-purple-400" />;
            case 'level_up': return <Sparkles size={12} className="text-emerald-400" />;
            default: return <Heart size={12} className="text-pink-400" />;
        }
    };

    return (
        <div className="w-full bg-white/[0.02] border-b border-white/5 py-2 px-4 overflow-hidden h-10 flex items-center justify-center relative group">
             <div className="absolute inset-0 bg-gradient-to-r from-[var(--reader-bg)] via-transparent to-[var(--reader-bg)] z-10 pointer-events-none" />
             
             <div 
                key={current.id}
                className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1 duration-700"
             >
                <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 shadow-inner">
                        {getIcon(current)}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">
                        {new Date(current.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 italic">
                    {getMessage(current)}
                </p>
                <div className="h-1 w-1 rounded-full bg-zinc-800" />
                <span className="text-[8px] font-black text-[var(--reader-accent)] uppercase tracking-widest animate-pulse">
                    LIVE
                </span>
             </div>
        </div>
    );
}
