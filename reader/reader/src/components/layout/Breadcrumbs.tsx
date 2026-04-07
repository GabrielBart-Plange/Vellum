"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { deslugify } from "@/lib/utils";

interface BreadcrumbItem {
    label: string;
    href: string;
    active?: boolean;
}

export default function Breadcrumbs() {
    const pathname = usePathname();
    if (!pathname || pathname === "/") return null;

    const segments = pathname.split("/").filter(Boolean);
    
    const items: BreadcrumbItem[] = [
        { label: "Home", href: "/" }
    ];

    let currentHref = "";
    segments.forEach((segment, index) => {
        currentHref += `/${segment}`;
        const isActive = index === segments.length - 1;
        
        // Custom label mapping
        let label = deslugify(segment);
        if (segment === "novel") label = "Novels";
        if (segment === "stories") label = "Short Stories";
        if (segment === "art") label = "Gallery";
        if (segment === "tag") label = "Archive";
        if (segment === "genre") label = "Pathways";

        items.push({
            label,
            href: currentHref,
            active: isActive
        });
    });

    return (
        <nav className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-left-4 duration-700">
            {items.map((item, index) => (
                <div key={item.href} className="flex items-center gap-2">
                    {index > 0 && (
                        <span className="text-[8px] text-zinc-700 font-black italic">/</span>
                    )}
                    {item.active ? (
                        <span className="text-[9px] uppercase tracking-widest text-[var(--reader-accent)] font-black italic">
                            {item.label}
                        </span>
                    ) : (
                        <Link 
                            href={item.href}
                            className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold hover:text-white transition-colors"
                        >
                            {item.label}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}
