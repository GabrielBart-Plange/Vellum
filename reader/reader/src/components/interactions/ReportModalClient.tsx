"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import ReportModal from "@/components/modals/ReportModal";

interface ReportModalClientProps {
    contentType: 'novel' | 'story' | 'chapter' | 'comment' | 'user';
    contentId: string;
    contentTitle?: string;
    authorId?: string;
}

export default function ReportModalClient({ contentType, contentId, contentTitle, authorId }: ReportModalClientProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="glass-panel p-2.5 rounded-2xl text-zinc-500 hover:text-red-400 transition-all hover:bg-red-500/5 hover:border-red-500/20"
                title="Report Content"
            >
                <Flag size={18} />
            </button>

            <ReportModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                contentType={contentType}
                contentId={contentId}
                contentTitle={contentTitle}
                authorId={authorId}
            />
        </>
    );
}
