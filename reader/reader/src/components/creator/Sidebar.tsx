const readerUrl = process.env.NEXT_PUBLIC_READER_URL || "http://localhost:3001";

export default function Sidebar() {
  return (
    <aside className="w-56 glass-panel border-r border-white/5 p-6 h-full flex flex-col">
      <h2 className="tracking-[0.2em] text-[10px] font-semibold text-[var(--reader-text)]/50 flex items-center gap-3 mb-10 overflow-hidden whitespace-nowrap">
        <div className="relative h-6 w-6 rounded-full bg-gradient-to-br from-[#8b0000] to-[#4a0000] flex items-center justify-center text-[10px] font-serif shadow-[0_2px_10px_rgba(139,0,0,0.5)] border border-[#a52a2a]/30 before:absolute before:inset-0 before:rounded-full before:bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)] overflow-hidden flex-shrink-0">
          <span className="relative z-10 text-[#aa8e45] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">V</span>
        </div>
        VELLUM ARCHIVIST
      </h2>

      <nav className="flex flex-col space-y-4">
        {[
          { name: "Overview", href: "/creator/dashboard" },
          { name: "Drafts", href: "/creator/dashboard/drafts" },
          { name: "Published", href: "/creator/dashboard/published" },
          { name: "Art Archives", href: "/creator/dashboard/art" },
          { name: "Settings", href: "/creator/dashboard/settings" },
          { name: "Exit to Reader", href: "/" },
        ].map((link) => (
          <a
            key={link.name}
            href={link.href}
            className="text-[var(--reader-text)]/70 hover:text-[var(--foreground)] text-xs uppercase tracking-[0.2em] transition-all hover:pl-2"
          >
            {link.name}
          </a>
        ))}
      </nav>

      <div className="mt-auto pt-8">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
          <p className="text-[10px] text-[var(--reader-text)]/40 leading-relaxed italic">
            The archives are endless, your stories are the key.
          </p>
        </div>
      </div>
    </aside>
  );
}
