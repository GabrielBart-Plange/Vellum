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
        // In a real app, we'd have a global 'activity' collection.
        // For now, let's pull from recent comments to simulate activity.
        const q = query(
            collection(db, "global_activity"), // Assuming this exists or we'll mock it
            orderBy("timestamp", "desc"),
            limit(5)
        );

        // Mocking some data if the collection is empty
        const mockActivities: ActivityItem[] = [
            { id: '1', type: 'comment', user: 'Nexus_Reader', target: 'Cyber Dreams', timestamp: new Date() },
            { id: '2', type: 'tip', user: 'Sarah', value: '500 Inklets', target: 'A Mysterious Scribe', timestamp: new Date() },
            { id: '3', type: 'level_up', user: 'Alex', value: 5, timestamp: new Date() },
            { id: '4', type: 'like', user: 'gabba', target: 'The Lost Scroll', timestamp: new Date() },
        ];

        setActivities(mockActivities);
        
        // Real listener would go here
        /*
        const unsubscribe = onSnapshot(q, (snap) => {
            const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityItem));
            setActivities(items);
        });
        return () => unsubscribe();
        */
    }, []);

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
                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">Just now</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
