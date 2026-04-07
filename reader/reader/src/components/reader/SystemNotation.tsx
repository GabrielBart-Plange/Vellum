"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Send, X, Trash2, Share2 } from "lucide-react";
import ShareSnippet from "./ShareSnippet";

import ManagedAd from "@/components/monetization/ManagedAd";

interface InlineComment {
    id: string;
    userId: string;
    username: string;
    text: string;
    createdAt: any;
    paragraphIndex: number;
}

interface SystemNotationProps {
    content: string;
    fontSize: number;
    chapterId?: string;
    novelId?: string;
    storyId?: string;
}

export default function SystemNotation({ content, fontSize, chapterId, novelId, storyId }: SystemNotationProps) {
    const { user } = useAuth();
    const [activeParagraph, setActiveParagraph] = useState<number | null>(null);
    const [inlineComments, setInlineComments] = useState<Record<number, InlineComment[]>>({});
    const [newComment, setNewComment] = useState("");
    const [submitting, setUnsubmitting] = useState(false);
    const [shareSnippet, setShareSnippet] = useState<{ text: string; paragraphIndex: number } | null>(null);

    const getCollectionPath = () => {
        if (novelId && chapterId) {
            return `novels/${novelId}/chapters/${chapterId}/inline_comments`;
        }
        if (storyId) {
            return `stories/${storyId}/inline_comments`;
        }
        return null;
    };

    useEffect(() => {
        const path = getCollectionPath();
        if (!path) return;

        const q = query(collection(db, path), orderBy("createdAt", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            const commentsByParagraph: Record<number, InlineComment[]> = {};
            snap.docs.forEach(doc => {
                const data = doc.data();
                const comment = { id: doc.id, ...data } as InlineComment;
                if (!commentsByParagraph[comment.paragraphIndex]) {
                    commentsByParagraph[comment.paragraphIndex] = [];
                }
                commentsByParagraph[comment.paragraphIndex].push(comment);
            });
            setInlineComments(commentsByParagraph);
        }, (error) => {
            console.error("Inline Comments Listener Error:", error);
        });

        return () => unsub();
    }, [novelId, chapterId, storyId]);

    const handlePostComment = async (pIndex: number) => {
        const path = getCollectionPath();
        if (!path || !user || !newComment.trim()) return;

        setUnsubmitting(true);
        try {
            await addDoc(collection(db, path), {
                userId: user.uid,
                username: user.displayName || "Anonymous",
                text: newComment.trim(),
                paragraphIndex: pIndex,
                createdAt: Timestamp.now()
            });
            setNewComment("");
        } catch (err) {
            console.error("Error posting inline comment:", err);
        } finally {
            setUnsubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        const path = getCollectionPath();
        if (!path || !user) return;

        try {
            await deleteDoc(doc(db, path, commentId));
        } catch (err) {
            console.error("Error deleting inline comment:", err);
        }
    };

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
                const comments = inlineComments[globalIndex] || [];
                
                // Inject an ad after every 5 paragraphs (or a specific interval)
                const showAd = globalIndex > 0 && globalIndex % 5 === 0;

                return (
                    <React.Fragment key={`${index}-${pIndex}`}>
                        <div
                            className={`mb-8 relative whitespace-pre-wrap leading-relaxed transition-all duration-300 px-4 -mx-4 py-2 rounded-2xl group cursor-pointer ${
                                activeParagraph === globalIndex 
                                ? 'bg-[var(--reader-accent)]/5 shadow-[inset_0_0_20px_rgba(139,92,246,0.05)] border-l-2 border-[var(--reader-accent)]/30' 
                                : 'hover:bg-white/[0.01]'
                            }`}
                            style={{ fontSize: `${fontSize}px` }}
                            onClick={() => setActiveParagraph(activeParagraph === globalIndex ? null : globalIndex)}
                        >
                            {p}
                            
                            {/* Paragraph Comment Count Badge */}
                            {comments.length > 0 && (
                                <div className="absolute -right-2 top-0 transform translate-x-full">
                                    <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full shadow-xl">
                                        <MessageSquare size={8} className="text-[var(--reader-accent)]" />
                                        <span className="text-[8px] font-black text-white italic">{comments.length}</span>
                                    </div>
                                </div>
                            )}

                            {/* Floating Comment Trigger */}
                            <span className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hidden md:flex gap-2">
                                <div 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShareSnippet({ text: p, paragraphIndex: globalIndex });
                                    }}
                                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm shadow-xl cursor-pointer hover:bg-white/10 transition-all"
                                >
                                    <Share2 size={14} className="text-zinc-500 group-hover:text-[var(--reader-accent)] transition-colors" />
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm shadow-xl">
                                    <MessageSquare size={14} className="text-zinc-500 group-hover:text-[var(--reader-accent)] transition-colors" />
                                </div>
                            </span>
                        </div>

                        {showAd && (
                            <div className="my-12 py-4 border-y border-white/5">
                                <ManagedAd zone="READER_MID" />
                            </div>
                        )}
                        
                        {activeParagraph === globalIndex && (
                            <div className="mt-4 animate-in slide-in-from-top-4 duration-500 space-y-4">
                                {/* Comment Input */}
                                {user ? (
                                    <div className="glass-panel border-[var(--reader-accent)]/20 rounded-2xl p-4 flex gap-4">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Whisper into the void..."
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm italic text-zinc-300 placeholder:text-zinc-600 resize-none h-10 py-2"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handlePostComment(globalIndex);
                                                }
                                            }}
                                        />
                                        <button 
                                            onClick={() => handlePostComment(globalIndex)}
                                            disabled={submitting || !newComment.trim()}
                                            className="p-2 rounded-xl bg-white text-black hover:bg-[var(--reader-accent)] hover:text-white transition-all disabled:opacity-30"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center p-6 glass-panel border-white/5 rounded-2xl">
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black italic">
                                            Sign in to whisper your thoughts
                                        </p>
                                    </div>
                                )}

                                {/* Existing Whispers */}
                                {comments.length > 0 && (
                                    <div className="space-y-3 pl-4 border-l border-white/5">
                                        <p className="text-[8px] uppercase tracking-[0.4em] text-zinc-600 font-black italic mb-2">Echoes of other seekers</p>
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="group/msg flex justify-between items-start gap-4 animate-in fade-in duration-300">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-[var(--reader-accent)] uppercase italic">{comment.username}</span>
                                                        <span className="text-[8px] text-zinc-700 font-bold">• {comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 italic leading-relaxed">{comment.text}</p>
                                                </div>
                                                {user && user.uid === comment.userId && (
                                                    <button 
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="opacity-0 group-hover/msg:opacity-100 p-1 text-zinc-700 hover:text-red-400 transition-all"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </React.Fragment>
                );
            });
        });
    };

    return (
        <>
            <div className="system-notation-container">{parseContent(content)}</div>
            {shareSnippet && (
                <ShareSnippet
                    text={shareSnippet.text}
                    onClose={() => setShareSnippet(null)}
                    storyTitle={storyId ? "Story" : "Novel Chapter"}
                    author={user?.displayName || "Anonymous"}
                />
            )}
        </>
    );
}
