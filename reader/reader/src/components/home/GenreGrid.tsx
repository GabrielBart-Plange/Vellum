import Link from "next/link";

const GENRES = [
    { name: "Fantasy", color: "from-purple-600 to-blue-600" },
    { name: "Sci-Fi", color: "from-blue-600 to-cyan-600" },
    { name: "Mystery", color: "from-zinc-700 to-zinc-900" },
    { name: "Romance", color: "from-[var(--accent-sakura)] to-purple-500" },
];

export default function GenreGrid() {
    return (
        <section className="py-24 px-4 max-w-6xl mx-auto">
            <header className="mb-12 text-center space-y-2">
                <h2 className="text-[11px] uppercase tracking-[0.6em] text-zinc-500 font-bold">Categories</h2>
                <p className="text-3xl font-bold tracking-tighter text-white uppercase italic">Choose your Archive</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {GENRES.map((genre) => (
                    <Link
                        key={genre.name}
                        href={`/novels?genre=${genre.name}`}
                        className="group relative h-48 rounded-2xl overflow-hidden border border-white/5 transition-all duration-500 hover:border-white/10"
                    >
                        {/* Stacked Image Effect Placeholder */}
                        <div className="absolute inset-0 bg-zinc-900/40 z-10" />

                        <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />

                        {/* Stacked Layers */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-36 bg-zinc-800 rounded-lg shadow-2xl transition-all duration-700 group-hover:rotate-6 group-hover:translate-x-4 border border-white/5" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-36 bg-zinc-800 rounded-lg shadow-2xl transition-all duration-700 group-hover:-rotate-6 group-hover:-translate-x-4 border border-white/5" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-36 bg-zinc-900 rounded-lg shadow-2xl z-20 border border-white/10 overflow-hidden">
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent`} />
                        </div>

                        <div className="absolute inset-0 z-30 p-6 flex flex-col justify-end">
                            <h3 className="text-lg font-bold text-white tracking-widest uppercase">{genre.name}</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest group-hover:text-[var(--accent-sakura)] transition-colors">Discover</p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
