"use client";

import { useState, useEffect } from "react";

interface ReadingSettingsProps {
    onThemeChange: (theme: string) => void;
    onFontSizeChange: (size: number) => void;
    currentTheme: string;
    currentFontSize: number;
}

export default function ReadingSettings({
    onThemeChange,
    onFontSizeChange,
    currentTheme,
    currentFontSize
}: ReadingSettingsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const themes = [
        { id: "void", name: "The Void", bg: "#000000", text: "#d4d4d8" },
        { id: "archive", name: "The Archive", bg: "#f5f2e9", text: "#2c2c2c" },
        { id: "nebula", name: "The Nebula", bg: "#0c0b1e", text: "#c7d2fe" },
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
                <div className="absolute bottom-16 right-0 w-64 bg-black/90 backdrop-blur-xl border border-white/10 p-6 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
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

                    <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Font Size</p>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onFontSizeChange(Math.max(12, currentFontSize - 2))}
                                className="flex-1 border border-white/10 py-1 hover:bg-white/5 text-sm"
                            >
                                -
                            </button>
                            <span className="text-xs text-center w-8">{currentFontSize}px</span>
                            <button
                                onClick={() => onFontSizeChange(Math.min(32, currentFontSize + 2))}
                                className="flex-1 border border-white/10 py-1 hover:bg-white/5 text-sm"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                        <p className="text-[9px] text-gray-600 italic">Adjusting the lens of your chronicle...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
