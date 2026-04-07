"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Comment, Like } from "@/types";

interface ActivityItem {
    id: string;
    type: 'comment' | 'like' | 'tip' | 'level_up';
    user: string;
    target?: string;
    value?: string | number;
    timestamp: any;
}

export default function PulseFeed() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);

    useEffect(() => {
        const q = query(
            collection(db, "global_activity"),
            orderBy("timestamp", "desc"),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const items = snap.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
            } as ActivityItem));
            setActivities(items);
        }, (error) => {
            console.error("Error listening to Pulse:", error);
        });

        return () => unsubscribe();
    }, []);

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="glass-panel rounded-3xl border border-white/5 p-6 space-y-6">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/60">The Pulse</h3>
            </div>

            <div className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 text-[11px] leading-tight group">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-purple-500/30 transition-all">
                            {activity.type === 'comment' && "💬"}
                            {activity.type === 'tip' && "✨"}
                            {activity.type === 'level_up' && "🆙"}
                            {activity.type === 'like' && "❤️"}
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-zinc-400">
                                <span className="text-white font-bold">{activity.user}</span>
                                {activity.type === 'comment' && ` shared a thought on `}
                                {activity.type === 'tip' && ` supported with ${activity.value} for `}
                                {activity.type === 'level_up' && ` reached `}
                                {activity.type === 'like' && ` liked `}

                                {activity.type === 'level_up' ? (
                                    <span className="text-purple-400 font-black">Level {activity.value}</span>
                                ) : (
                                    <span className="text-zinc-200 italic font-medium">{activity.target}</span>
                                )}<br />
                            </p>
                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">{formatTime(activity.timestamp)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
