"use client";

import React, { useState } from "react";

interface SystemNotationProps {
    content: string;
    fontSize: number;
    chapterId?: string;
    novelId?: string;
}

export default function SystemNotation({ content, fontSize, chapterId, novelId }: SystemNotationProps) {
    const [activeParagraph, setActiveParagraph] = useState<number | null>(null);

    const parseContent = (text: string) => {
        const parts = text.split(/(\[System:[\s\S]*?\]|\{Quest:[\s\S]*?\}|\|Status.*?\|[\s\S]*?\|\/Status\|)/g);

        let paragraphCounter = 0;

        return parts.map((part, index) => {
            if (!part || !part.trim()) return null;

            // --- 1. [System: Header | Message] ---
            if (part.startsWith("[System:")) {
                const inner = part.replace("[System:", "").replace("]", "").trim();
                const [header, ...msgParts] = inner.includes("|") ? inner.split("|") : [null, inner];
                const message = msgParts.join("|").trim();

                return (
                    <div
                        key={index}
                        className="my-8 p-6 border-l-2 animate-in fade-in slide-in-from-left-2 duration-700 relative group overflow-hidden rounded-r-3xl"
                        style={{ backgroundColor: 'var(--notion-sys-bg)', borderColor: 'var(--notion-sys-border)' }}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8l-4 4l4 4"/><path d="M16 12H8"/><circle cx="12" cy="12" r="10"/></svg>
                        </div>
                        {header && (
                            <p className="text-[9px] uppercase tracking-[0.4em] font-black mb-3 italic" style={{ color: 'var(--notion-sys-border)' }}>
                                {header.trim()}
                            </p>
                        )}
                        <p className="italic font-black leading-relaxed whitespace-pre-wrap" style={{ fontSize: `${fontSize}px`, color: 'var(--notion-sys-text)' }}>
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
                        className="my-12 border overflow-hidden shadow-2xl rounded-3xl border-t-2"
                        style={{ backgroundColor: 'var(--notion-qst-bg)', borderColor: 'var(--notion-qst-border)' }}
                    >
                        <div className="px-6 py-3 border-b flex justify-between items-center" style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'var(--notion-qst-border)' }}>
                            <p className="text-[9px] uppercase tracking-[0.5em] font-black italic" style={{ color: 'var(--notion-qst-border)' }}>
                                {title.trim()}
                            </p>
                            <span className="text-[8px] font-black tracking-widest uppercase italic opacity-40" style={{ color: 'var(--notion-qst-text)' }}>ARCHIVE NOTIFICATION</span>
                        </div>
                        <div className="p-8 space-y-4 whitespace-pre-wrap font-black italic leading-relaxed" style={{ fontSize: `${fontSize}px`, color: 'var(--notion-qst-text)' }}>
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
                        className="my-12 border backdrop-blur-md overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all rounded-3xl border-t-2"
                        style={{ backgroundColor: 'var(--notion-sta-bg)', borderColor: 'var(--notion-sta-border)' }}
                    >
                        {title && (
                            <div className="px-6 py-3 border-b flex justify-between items-center" style={{ backgroundColor: 'rgba(0,0,0,0.01)', borderColor: 'var(--notion-sta-border)' }}>
                                <p className="text-[9px] uppercase tracking-[0.4em] font-black italic" style={{ color: 'var(--notion-sta-text)' }}>
                                    {title}
                                </p>
                                <div className="flex gap-1.5 opacity-30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                </div>
                            </div>
                        )}
                        <div className="p-8 space-y-4">
                            {lines.map((line, i) => {
                                const [label, ...valParts] = line.split(":");
                                const value = valParts.join(":");
                                if (!label.trim()) return null;
                                return (
                                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0" style={{ opacity: 0.9 }}>
                                        <span className="text-[9px] uppercase tracking-[0.2em] font-black text-zinc-500 italic">{label.trim()}</span>
                                        <span className="text-xs font-black italic" style={{ color: 'var(--notion-sta-text)' }}>{value?.trim() || "---"}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            // Normal text - Split into paragraphs for inline commenting
            const paragraphs = part.split("\n").filter(p => p.trim());
            
            return paragraphs.map((p, pIndex) => {
                const globalIndex = paragraphCounter++;
                return (
                    <div
                        key={`${index}-${pIndex}`}
                        className="whitespace-pre-wrap leading-relaxed mb-8 relative group cursor-pointer hover:bg-white/[0.01] rounded-2xl transition-all px-4 -mx-4 py-2"
                        style={{ fontSize: `${fontSize}px` }}
                        onClick={() => setActiveParagraph(activeParagraph === globalIndex ? null : globalIndex)}
                    >
                        {p}
                        <span className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm shadow-xl">
                                <span className="text-xs grayscale group-hover:grayscale-0 transition-all">💬</span>
                            </div>
                        </span>
                        
                        {activeParagraph === globalIndex && (
                            <span className="block mt-6 p-6 glass-panel border-[var(--reader-accent)]/20 rounded-2xl text-[10px] uppercase tracking-widest text-zinc-500 font-black italic animate-in slide-in-from-top-4 duration-500 text-center">
                                <span className="block mb-2 text-[var(--reader-accent)]">Whispers from the Void</span>
                                Inline comments are being etched into the archive. Share your thoughts on this moment soon!
                            </span>
                        )}
                    </div>
                );
            });
        });
    };

    return <div className="system-notation-container">{parseContent(content)}</div>;
}
