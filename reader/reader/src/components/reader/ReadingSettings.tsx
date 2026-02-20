"use client";

import { useState, useEffect } from "react";

interface ReadingSettingsProps {
    onThemeChange: (theme: string) => void;
    onFontSizeChange: (size: number) => void;
    onFontFamilyChange: (font: string) => void;
    currentTheme: string;
    currentFontSize: number;
    currentFontFamily: string;
}

export default function ReadingSettings({
    onThemeChange,
    onFontSizeChange,
    onFontFamilyChange,
    currentTheme,
    currentFontSize,
    currentFontFamily
}: ReadingSettingsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const themes = [
        { id: "void", name: "The Void (OLED)", bg: "#000000", text: "#d4d4d8" },
        { id: "archive", name: "The Archive (Sepia)", bg: "#f5f2e9", text: "#2c2c2c" },
        { id: "midnight", name: "The Midnight", bg: "#0f172a", text: "#e2e8f0" },
        { id: "light", name: "The Light", bg: "#ffffff", text: "#1a1a1a" },
    ];

    return (
        <div className="fixed bottom-10 right-10 z-[100]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-xl group"
            >
                <span className={`text-xl group-hover:rotate-45 transition-transform ${currentTheme === 'light' || currentTheme === 'archive' ? 'text-black' : 'text-white'}`}>⚙️</span>
            </button>

            {isOpen && (
                <div className="absolute bottom-16 right-0 w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Reading Engine</p>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-zinc-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Chronicle Theme</p>
                        <div className="grid grid-cols-4 gap-2">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => onThemeChange(t.id)}
                                    title={t.name}
                                    style={{ backgroundColor: t.bg }}
                                    className={`h-8 w-full border ${currentTheme === t.id ? 'border-white scale-110' : 'border-white/10 hover:border-white/30'} transition-all`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Font Type</p>
                            <div className="flex bg-white/5 rounded-lg p-1">
                                <button
                                    onClick={() => onFontFamilyChange("sans")}
                                    className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${currentFontFamily === 'sans' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    SANS
                                </button>
                                <button
                                    onClick={() => onFontFamilyChange("serif")}
                                    className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all font-serif ${currentFontFamily === 'serif' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    SERIF
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Font Size</p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onFontSizeChange(Math.max(12, currentFontSize - 2))}
                                    className="w-8 border border-white/10 py-1 hover:bg-white/5 text-sm rounded"
                                >
                                    -
                                </button>
                                <span className="text-[10px] font-bold text-center w-6">{currentFontSize}</span>
                                <button
                                    onClick={() => onFontSizeChange(Math.min(32, currentFontSize + 2))}
                                    className="w-8 border border-white/10 py-1 hover:bg-white/5 text-sm rounded"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 text-center">
                        <p className="text-[9px] text-gray-600 italic">Adjusting the lens of your chronicle...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
