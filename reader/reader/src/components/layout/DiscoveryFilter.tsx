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
    placeholder = "Search the archives..."
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
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-zinc-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={() => handleCategoryClick("All")}
                    className={`px-6 py-2 rounded-full text-[11px] uppercase tracking-[0.2em] font-black transition-all border ${activeCategory === "All"
                            ? "bg-white text-black border-white"
                            : "bg-transparent text-zinc-500 border-white/10 hover:border-white/20 hover:text-white"
                        }`}
                >
                    All Types
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className={`px-6 py-2 rounded-full text-[11px] uppercase tracking-[0.2em] font-black transition-all border ${activeCategory === cat
                                ? "bg-purple-600 text-white border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                                : "bg-transparent text-zinc-500 border-white/10 hover:border-white/20 hover:text-white"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
}
