import { useState } from "react";
import { useTheme, Theme } from "@/contexts/ThemeContext";

interface ReadingSettingsProps {
    onFontSizeChange: (size: number) => void;
    onFontFamilyChange: (font: string) => void;
    currentFontSize: number;
    currentFontFamily: string;
}

export default function ReadingSettings({
    onFontSizeChange,
    onFontFamilyChange,
    currentFontSize,
    currentFontFamily
}: ReadingSettingsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    const themes: { id: Theme; name: string; bg: string; text: string }[] = [
        { id: "void", name: "The Void (OLED)", bg: "#000000", text: "#d4d4d8" },
        { id: "archive", name: "The Archive (Sepia)", bg: "#f5f2e9", text: "#2c2c2c" },
        { id: "midnight", name: "The Midnight", bg: "#0f172a", text: "#e2e8f0" },
        { id: "light", name: "The Light", bg: "#ffffff", text: "#1a1a1a" },
        { id: "nebula", name: "The Nebula", bg: "#110e20", text: "#c084fc" },
        { id: "serene", name: "The Serene", bg: "#fff5f7", text: "#f472b6" },
    ];

    return (
        <div className="fixed bottom-10 right-10 z-[100]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-xl group"
                title="Calibrate Reading Engine"
            >
                <span className={`text-xl group-hover:rotate-45 transition-transform ${theme === 'light' || theme === 'archive' ? 'text-black' : 'text-white'}`}>⚙️</span>
            </button>

            {isOpen && (
                <div className="absolute bottom-20 right-0 w-72 bg-[#0b0a0f]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-accent)] font-black italic">Reading Engine</p>
                            <p className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">Calibrate your immersion</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-black italic">Atmosphere</p>
                        <div className="grid grid-cols-3 gap-3">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    title={t.name}
                                    style={{ backgroundColor: t.bg }}
                                    className={`h-10 w-full rounded-xl border-2 transition-all duration-300 ${theme === t.id ? 'border-[var(--reader-accent)] scale-110 shadow-[0_0_15px_var(--reader-accent)]/20' : 'border-white/5 hover:border-white/20'}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-black italic">Typography</p>
                            <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/5">
                                <button
                                    onClick={() => onFontFamilyChange("sans")}
                                    className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest italic ${currentFontFamily === 'sans' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Modern
                                </button>
                                <button
                                    onClick={() => onFontFamilyChange("serif")}
                                    className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all font-serif uppercase tracking-widest italic ${currentFontFamily === 'serif' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Classic
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-black italic">Text Size</p>
                            <div className="flex items-center justify-between bg-white/5 rounded-2xl p-1.5 border border-white/5">
                                <button
                                    onClick={() => onFontSizeChange(Math.max(12, currentFontSize - 2))}
                                    className="w-10 h-10 flex items-center justify-center border border-white/5 hover:bg-white/5 text-lg rounded-xl transition-all active:scale-90"
                                >
                                    -
                                </button>
                                <span className="text-[11px] font-black text-white italic">{currentFontSize}px</span>
                                <button
                                    onClick={() => onFontSizeChange(Math.min(32, currentFontSize + 2))}
                                    className="w-10 h-10 flex items-center justify-center border border-white/5 hover:bg-white/5 text-lg rounded-xl transition-all active:scale-90"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 text-center">
                        <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-black italic">Aligning the chronicle to your gaze...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
