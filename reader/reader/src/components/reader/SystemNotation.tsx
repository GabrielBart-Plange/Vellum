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
        const parts = text.split(/(\[System:.*?\]|\{Quest:[\s\S]*?\}|\|Status.*?\|[\s\S]*?\|\/Status\|)/g);

        return parts.map((part, index) => {
            // --- 1. [System: Header | Message] ---
            if (part.startsWith("[System:")) {
                const inner = part.replace("[System:", "").replace("]", "").trim();
                const [header, ...msgParts] = inner.includes("|") ? inner.split("|") : [null, inner];
                const message = msgParts.join("|").trim();

                return (
                    <div
                        key={index}
                        className="my-6 p-4 border-l-4 animate-in fade-in slide-in-from-left-2 duration-500 shadow-sm"
                        style={{ backgroundColor: 'var(--notion-sys-bg)', borderColor: 'var(--notion-sys-border)' }}
                    >
                        {header && (
                            <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--notion-sys-border)' }}>
                                {header.trim()}
                            </p>
                        )}
                        <p className="italic font-medium leading-relaxed" style={{ fontSize: `${fontSize}px`, color: 'var(--notion-sys-text)' }}>
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
                    <div
                        key={index}
                        className="my-10 border overflow-hidden shadow-xl border-t-4"
                        style={{ backgroundColor: 'var(--notion-qst-bg)', borderColor: 'var(--notion-qst-border)' }}
                    >
                        <div className="px-4 py-2 border-b flex justify-between items-center" style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'var(--notion-qst-border)' }}>
                            <p className="text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: 'var(--notion-qst-border)' }}>
                                {title.trim()}
                            </p>
                            <span className="text-[9px] font-bold italic opacity-50" style={{ color: 'var(--notion-qst-text)' }}>SYSTEM DIRECTIVE</span>
                        </div>
                        <div className="p-6 space-y-4 whitespace-pre-wrap font-medium leading-relaxed" style={{ fontSize: `${fontSize}px`, color: 'var(--notion-qst-text)' }}>
                            {questContent}
                        </div>
                    </div>
                );
            }

            // --- 3. |Status: Title| ... |/Status| ---
            if (part.startsWith("|Status")) {
                const headerEnd = part.indexOf("|", 1);
                const headerPart = part.substring(1, headerEnd);
                const title = headerPart.includes(":") ? headerPart.split(":")[1].trim() : null;

                const fullStatusMatch = part.match(/\|Status.*?\|([\s\S]*?)\|\/Status\|/);
                const lines = (fullStatusMatch ? fullStatusMatch[1] : "").trim().split("\n");

                return (
                    <div
                        key={index}
                        className="my-10 border backdrop-blur-sm overflow-hidden shadow-2xl transition-all"
                        style={{ backgroundColor: 'var(--notion-sta-bg)', borderColor: 'var(--notion-sta-border)' }}
                    >
                        {title && (
                            <div className="px-4 py-2 border-b flex justify-between items-center" style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'var(--notion-sta-border)' }}>
                                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--notion-sta-text)' }}>
                                    {title}
                                </p>
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/30" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                                </div>
                            </div>
                        )}
                        <div className="p-6 space-y-3">
                            {lines.map((line, i) => {
                                const [label, ...valParts] = line.split(":");
                                const value = valParts.join(":");
                                if (!label.trim()) return null;
                                return (
                                    <div key={i} className="flex justify-between items-center border-b pb-1 last:border-0" style={{ borderColor: 'var(--notion-sta-border)', opacity: 0.9 }}>
                                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-60" style={{ color: 'var(--notion-sta-text)' }}>{label.trim()}</span>
                                        <span className="text-xs font-mono font-bold" style={{ color: 'var(--notion-sta-text)' }}>{value?.trim() || "---"}</span>
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
