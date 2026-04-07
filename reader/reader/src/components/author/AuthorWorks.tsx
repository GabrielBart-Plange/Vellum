"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "@/components/cards/StoryCard";
import { Novel, Story } from "@/types";
import Link from "next/link";

interface AuthorWorksProps {
    authorId: string;
    authorName: string;
    currentWorkId: string;
    type: 'novel' | 'story';
}

export default function AuthorWorks({ authorId, authorName, currentWorkId, type }: AuthorWorksProps) {
    const [works, setWorks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWorks = async () => {
            if (!authorId) return;
            setLoading(true);
            try {
                // Fetch from both collections to show all works by the author
                const novelsQuery = query(
                    collection(db, "novels"),
                    where("authorId", "==", authorId),
                    where("published", "==", true),
                    orderBy("createdAt", "desc"),
                    limit(6)
                );

                const storiesQuery = query(
                    collection(db, "stories"),
                    where("authorId", "==", authorId),
                    where("published", "==", true),
                    orderBy("createdAt", "desc"),
                    limit(6)
                );

                const [novelsSnap, storiesSnap] = await Promise.all([
                    getDocs(novelsQuery),
                    getDocs(storiesQuery)
                ]);

                const novels = novelsSnap.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(), 
                    workType: 'novel' 
                }));
                
                const stories = storiesSnap.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(), 
                    workType: 'story' 
                }));

                // Combine and sort by date
                const combined = [...novels, ...stories]
                    .filter(work => work.id !== currentWorkId)
                    .sort((a: any, b: any) => {
                        const dateA = a.createdAt?.seconds || 0;
                        const dateB = b.createdAt?.seconds || 0;
                        return dateB - dateA;
                    })
                    .slice(0, 5); // Show top 5 recent works

                setWorks(combined);
            } catch (err) {
                console.error("Error fetching author works:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorks();
    }, [authorId, currentWorkId, type]);

    if (!loading && works.length === 0) return null;

    return (
        <section className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.6em] text-[var(--reader-text-subtle)] font-black italic">More From</p>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{authorName}</h3>
                </div>
                <Link 
                    href={`/authors/${authorId}`}
                    className="text-[10px] uppercase tracking-widest text-[var(--reader-accent)] font-black hover:text-white transition-colors border-b border-[var(--reader-accent)]/20 pb-1"
                >
                    View Full Archive
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse space-y-4">
                            <div className="aspect-[2/3] bg-zinc-900/50 rounded-lg" />
                            <div className="h-3 bg-zinc-900/50 rounded w-3/4" />
                        </div>
                    ))
                ) : (
                    works.map((work: any) => (
                        <StoryCard
                            key={work.id}
                            id={work.id}
                            slug={work.slug}
                            alphanumericId={work.alphanumericId}
                            title={work.title}
                            author={work.authorName}
                            imageUrl={work.coverImage || work.imageUrl}
                            category={work.genre || work.category || (work.workType === 'novel' ? 'Novel' : 'Story')}
                            type={work.workType === 'story' ? 'short' : 'novel'}
                            hideAuthor={true}
                        />
                    ))
                )}
            </div>
        </section>
    );
}
