import Image from "next/image";
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

    // Check if the image is external to use unoptimized for better performance with large assets if needed
    const isExternal = displayImage.startsWith('http') && !displayImage.includes('localhost');

    const CardContent = (
        <div className="group relative cursor-pointer flex flex-col gap-2">
            {/* Image Container */}
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-[var(--reader-border)] shadow-xl transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.8)]">
                <Image
                    src={displayImage}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
                    className="object-cover opacity-90 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                    priority={false}
                    unoptimized={isExternal}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                {/* Category Tag */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                    <span className="rounded-md border border-[var(--glass-border)] glass-panel px-2 py-0.5 text-[8px] font-bold text-[var(--reader-text)] uppercase tracking-wider backdrop-blur-sm">
                        {category}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-0.5 px-0.5">
                <h3 className="line-clamp-1 text-[13px] font-bold text-[var(--reader-text)] transition-colors">
                    {title}
                </h3>
                {!hideAuthor && (
                    <p className="text-[11px] font-medium text-[var(--reader-text)]/50 group-hover:text-[var(--reader-text)]/70 transition-colors">
                        {author}
                    </p>
                )}
            </div>
        </div>
    );

    const isNovel = type === "novel" || category === "Novel" || category === "fiction" && !id; // Slightly broader heuristic
    const linkHref = isNovel ? `/novels/${id}` : `/stories/${id}`;

    return id ? (
        <Link href={linkHref} className="block">
            {CardContent}
        </Link>
    ) : (
        CardContent
    );
}
