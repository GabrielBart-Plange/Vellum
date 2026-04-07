"use client";

import { Share2, Twitter, MessageSquare, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

interface ViralShareProps {
  title: string;
  url: string;
  author: string;
}

export default function ViralShare({ title, url, author }: ViralShareProps) {
  const [copied, setCopied] = useState(false);
  const shareText = `Check out "${title}" by ${author} on Vellum! 📚✨`;
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`, '_blank');
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + fullUrl)}`, '_blank');
  };

  return (
    <div className="flex flex-wrap items-center gap-4 py-6 border-t border-white/5">
      <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-black italic">Spread the Word</p>
      
      <div className="flex items-center gap-2">
        <button
          onClick={shareToTwitter}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400/50 hover:text-blue-400 transition-all group"
          title="Share on X"
        >
          <Twitter className="w-4 h-4" />
        </button>

        <button
          onClick={shareToWhatsApp}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400/50 hover:text-emerald-400 transition-all group"
          title="Share on WhatsApp"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[var(--reader-accent)]/50 hover:text-white transition-all group"
        >
          <LinkIcon className="w-3 h-3" />
          <span className="text-[10px] uppercase font-black tracking-widest italic">
            {copied ? "Copied!" : "Copy Link"}
          </span>
        </button>
      </div>
    </div>
  );
}
