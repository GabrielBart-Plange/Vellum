import Link from "next/link";

interface StoryCardProps {
    id?: string;
    title?: string;
    author?: string;
    imageUrl?: string;
    coverImage?: string; // Fallback for novels
    category?: string;
    type?: "short" | "novel";
    hideAuthor?: boolean;
}

export default function StoryCard({
    id,
    title = "Untitled Story",
    author = "Unknown Author",
    imageUrl,
    coverImage,
    category = "Fantasy",
    type,
    hideAuthor = false,
}: StoryCardProps) {
    const displayImage = coverImage || imageUrl || "https://placehold.co/400x600/1a1a1a/666666?text=Cover";
    const CardContent = (
        <div className="group relative cursor-pointer flex flex-col gap-4">
            {/* Image Container */}
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)]">
                <img
                    src={displayImage}
                    alt={title}
                    className="h-full w-full object-cover opacity-90 transition-all duration-700 group-hover:opacity-100 group-hover:scale-110"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                {/* Category Tag */}
                <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="rounded-full border border-white/40 glass-panel px-3 py-1 text-[9px] font-bold text-white uppercase tracking-widest backdrop-blur-md">
                        {category}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-1 px-1">
                <h3 className="line-clamp-1 text-base font-bold text-zinc-100 group-hover:text-white transition-colors">
                    {title}
                </h3>
                {!hideAuthor && (
                    <p className="text-[13px] font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">
                        {author}
                    </p>
                )}
            </div>
        </div>
    );

    const isNovel = type === "novel" || category === "Novel";
    const linkHref = isNovel ? `/novels/${id}` : `/stories/${id}`;

    return id ? (
        <Link href={linkHref} className="block">
            {CardContent}
        </Link>
    ) : (
        CardContent
    );
}
