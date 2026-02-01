"use client";

import React from "react";

interface SystemNotationProps {
    content: string;
    fontSize: number;
}

export default function SystemNotation({ content, fontSize }: SystemNotationProps) {
    // Regex for different notations
    // 1. [System: ...]
    // 2. {Quest: ...}
    // 3. |Status| ... |/Status|

    const parseContent = (text: string) => {
        // This is a simplified parser. For more complex nested tags, a more robust solution would be needed.
        const parts = text.split(/(\[System:.*?\]|\{Quest:.*?\}|\|Status\|[\s\S]*?\|\/Status\|)/g);

        return parts.map((part, index) => {
            if (part.startsWith("[System:")) {
                const message = part.replace("[System:", "").replace("]", "").trim();
                return (
                    <div key={index} className="my-6 p-4 bg-indigo-500/10 border-l-4 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)] animate-in fade-in slide-in-from-left-2 duration-500">
                        <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-1">System Notification</p>
                        <p className="italic text-indigo-100/90" style={{ fontSize: `${fontSize}px` }}>{message}</p>
                    </div>
                );
            }

            if (part.startsWith("{Quest:")) {
                const questContent = part.replace("{Quest:", "").replace("}", "").trim();
                return (
                    <div key={index} className="my-8 p-6 border-2 border-amber-500/30 bg-amber-500/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50" />
                        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-500 font-black mb-4">NEW QUEST RECEIVED</p>
                        <div className="space-y-2 text-amber-100/90 whitespace-pre-wrap" style={{ fontSize: `${fontSize}px` }}>
                            {questContent}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <span className="text-[9px] uppercase tracking-widest text-amber-500/50 italic font-bold">Fate awaits your decision...</span>
                        </div>
                    </div>
                );
            }

            if (part.startsWith("|Status|")) {
                const statusBody = part.replace("|Status|", "").replace("|/Status|", "").trim();
                const lines = statusBody.split("\n");
                return (
                    <div key={index} className="my-10 border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden shadow-2xl">
                        <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Chronicle Status Screen</p>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                            </div>
                        </div>
                        <div className="p-6 space-y-3">
                            {lines.map((line, i) => {
                                const [label, ...valParts] = line.split(":");
                                const value = valParts.join(":");
                                return (
                                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500">{label.trim()}</span>
                                        <span className="text-xs font-mono text-gray-200">{value?.trim() || "---"}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            // Normal text
            return <span key={index} className="whitespace-pre-wrap">{part}</span>;
        });
    };

    return <div className="system-notation-container">{parseContent(content)}</div>;
}
