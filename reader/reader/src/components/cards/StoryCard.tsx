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
        <div className="group relative cursor-pointer flex flex-col gap-3">
            {/* Image Container */}
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-900 shadow-lg transition-transform duration-300 group-hover:-translate-y-1">
                <img
                    src={displayImage}
                    alt={title}
                    className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40" />

                {/* Category Tag */}
                <span className="absolute top-2 left-2 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-md text-[10px] uppercase tracking-wider">
                    {category}
                </span>
            </div>

            {/* Content */}
            <div className="space-y-1">
                <h3 className="line-clamp-1 text-lg font-semibold text-gray-100 group-hover:text-white">
                    {title}
                </h3>
                {!hideAuthor && (
                    <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300">
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
