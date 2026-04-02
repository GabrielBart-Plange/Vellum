"use client";

import { useState } from "react";

interface DiscoveryFilterProps {
    categories: string[];
    onSearch: (term: string) => void;
    onCategoryChange: (category: string) => void;
    placeholder?: string;
}

export default function DiscoveryFilter({
    categories,
    onSearch,
    onCategoryChange,
    placeholder = "Search for stories..."
}: DiscoveryFilterProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        onSearch(val);
    };

    const handleCategoryClick = (cat: string) => {
        setActiveCategory(cat);
        onCategoryChange(cat);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Search Bar */}
            <div className="relative max-w-2xl">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={placeholder}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-8 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-4 focus:ring-[var(--reader-accent)]/10 focus:border-[var(--reader-accent)]/40 transition-all italic font-medium"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-zinc-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <button
                    onClick={() => handleCategoryClick("All")}
                    className={`px-8 py-2.5 rounded-full text-[10px] uppercase tracking-[0.3em] font-black transition-all border italic ${activeCategory === "All"
                            ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            : "bg-transparent text-zinc-600 border-white/5 hover:border-white/20 hover:text-white"
                        }`}
                >
                    All Genres
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className={`px-8 py-2.5 rounded-full text-[10px] uppercase tracking-[0.3em] font-black transition-all border italic ${activeCategory === cat
                                ? "bg-[var(--reader-accent)] text-white border-[var(--reader-accent)] shadow-[0_0_25px_rgba(168,85,247,0.2)]"
                                : "bg-transparent text-zinc-600 border-white/5 hover:border-white/20 hover:text-white"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
}
