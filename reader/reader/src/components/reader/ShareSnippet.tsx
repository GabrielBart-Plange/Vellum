"use client";

import { useState } from "react";
import { Quote, Share2, Camera, X } from "lucide-react";

interface ShareSnippetProps {
  text: string;
  author: string;
  storyTitle: string;
  onClose: () => void;
}

export default function ShareSnippet({ text, author, storyTitle, onClose }: ShareSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const shareText = `"${text}"\n\n— ${author}, ${storyTitle}\nRead more on Vellum: ${window.location.origin}${window.location.pathname}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-12 space-y-8">
          <header className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.4em] text-purple-500 font-black italic">Archivist's Echo</p>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Share this Revelation</h3>
          </header>

          {/* The Preview Card */}
          <div id="share-card" className="relative p-10 rounded-3xl bg-gradient-to-br from-zinc-800 to-black border border-white/5 space-y-6 shadow-inner">
            <Quote className="absolute top-6 left-6 w-12 h-12 text-purple-500/10" />
            <p className="text-lg leading-relaxed text-zinc-200 font-serif italic relative z-10">
              {text}
            </p>
            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-white uppercase tracking-widest">{author}</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">{storyTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <span className="text-[8px] font-black text-purple-400">V</span>
                </div>
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Vellum.app</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              <Share2 size={14} />
              {copied ? "Copied!" : "Copy Text"}
            </button>
            <button
              onClick={() => alert("Tip: Take a screenshot of the card for the best look on Instagram/TikTok!")}
              className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all italic"
            >
              <Camera size={14} className="text-purple-500" />
              Capture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
