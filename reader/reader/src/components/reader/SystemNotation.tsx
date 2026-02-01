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
        // Improved regex to handle multiline quests and status screens properly
        const parts = text.split(/(\[System:.*?\]|\{Quest:[\s\S]*?\}|\|Status.*?\|[\s\S]*?\|\/Status\|)/g);

        return parts.map((part, index) => {
            // --- 1. [System: Header | Message] ---
            if (part.startsWith("[System:")) {
                const inner = part.replace("[System:", "").replace("]", "").trim();
                const [header, ...msgParts] = inner.includes("|") ? inner.split("|") : [null, inner];
                const message = msgParts.join("|").trim();

                return (
                    <div key={index} className="my-6 p-4 border-l-4 border-indigo-500 bg-indigo-500/[0.03] dark:bg-indigo-500/5 animate-in fade-in slide-in-from-left-2 duration-500">
                        {header && (
                            <p className="text-[10px] uppercase tracking-widest font-bold mb-1 text-indigo-700 dark:text-indigo-400">
                                {header.trim()}
                            </p>
                        )}
                        <p className="italic text-gray-900 dark:text-indigo-100/90 font-medium dark:font-normal" style={{ fontSize: `${fontSize}px` }}>
                            {message}
                        </p>
                    </div>
                );
            }

            // --- 2. {Quest: Title | Content} ---
            if (part.startsWith("{Quest:")) {
                const inner = part.replace("{Quest:", "").replace("}", "").trim();
                const [title, ...contentParts] = inner.includes("|") ? inner.split("|") : ["QUEST UPDATE", inner];
                const questContent = contentParts.join("|").trim();

                return (
                    <div key={index} className="my-10 border border-amber-600/30 dark:border-amber-600/20 bg-amber-600/[0.02] dark:bg-amber-600/5 overflow-hidden shadow-lg border-t-amber-600 dark:border-t-amber-600/50 border-t-2">
                        <div className="bg-amber-600/10 px-4 py-2 border-b border-amber-600/10 flex justify-between items-center">
                            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-amber-800 dark:text-amber-500">
                                {title.trim()}
                            </p>
                            <span className="text-[9px] font-bold italic text-amber-700/40 dark:text-amber-500/50">SYSTEM DIRECTIVE</span>
                        </div>
                        <div className="p-6 space-y-4 whitespace-pre-wrap text-gray-900 dark:text-amber-100/90 font-medium dark:font-normal" style={{ fontSize: `${fontSize}px` }}>
                            {questContent}
                        </div>
                    </div>
                );
            }

            // --- 3. |Status: Title| ... |/Status| ---
            if (part.startsWith("|Status")) {
                const headerEnd = part.indexOf("|", 1);
                const headerPart = part.substring(1, headerEnd); // e.g. "Status: My Title"
                const title = headerPart.includes(":") ? headerPart.split(":")[1].trim() : null;

                const statusBody = part.split("|").slice(2, -2).join("|").trim();
                // A safer way to get body: 
                const fullStatusMatch = part.match(/\|Status.*?\|([\s\S]*?)\|\/Status\|/);
                const lines = (fullStatusMatch ? fullStatusMatch[1] : "").trim().split("\n");

                return (
                    <div key={index} className="my-10 border border-gray-400/30 dark:border-white/10 bg-gray-400/[0.03] dark:bg-black/40 backdrop-blur-sm overflow-hidden shadow-2xl transition-all">
                        {title && (
                            <div className="bg-gray-400/10 dark:bg-white/5 px-4 py-2 border-b border-gray-400/20 dark:border-white/10 flex justify-between items-center">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-800 dark:text-gray-400">
                                    {title}
                                </p>
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                </div>
                            </div>
                        )}
                        <div className="p-6 space-y-3">
                            {lines.map((line, i) => {
                                const [label, ...valParts] = line.split(":");
                                const value = valParts.join(":");
                                if (!label.trim()) return null;
                                return (
                                    <div key={i} className="flex justify-between items-center border-b border-gray-400/10 dark:border-white/5 pb-1 last:border-0">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-600 dark:text-gray-500 font-bold">{label.trim()}</span>
                                        <span className="text-xs font-mono text-gray-900 dark:text-gray-200 font-bold dark:font-normal">{value?.trim() || "---"}</span>
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
