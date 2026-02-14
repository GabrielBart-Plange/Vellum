"use client";

import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function NewDraftPage() {
    const router = useRouter();

    const sanitizeTitle = (title: string) => {
        let clean = title
            .replace(/_?OceanofPDF\.com_?/gi, "")
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        // If it contains " - ", try to take the first part if it's the title
        if (clean.includes(" - ")) {
            const parts = clean.split(" - ");
            if (parts[0].toLowerCase().includes("deception")) clean = parts[0];
        }

        // Capitalize properly
        return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };

    const detectChapters = (text: string) => {
        // Robust regex: Matches "Chapter X", "PART X", "# Title"
        const chapterRegex = /(?:\n|\r|\s{2,}|^)(Chapter|CHAPTER|Part|PART|#)\s+([0-9A-ZA-Z]+|[IVXLCDM]+)(?:\:|\s+)?([^\n\r]*)/gi;
        let allMatches: { type: string, number: string, title: string, content: string, start: number, partContext: string }[] = [];

        const matches = Array.from(text.matchAll(chapterRegex));

        if (matches.length === 0) return [];

        const firstMatchIndex = matches[0].index || 0;
        let introduction = "";
        if (firstMatchIndex > 0) {
            introduction = text.substring(0, firstMatchIndex).trim();
        }

        let currentPart = "default";
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const start = (match.index || 0) + match[0].length;
            const end = i < matches.length - 1 ? (matches[i + 1].index || 0) : text.length;

            const type = match[1].toUpperCase();
            const number = match[2];
            // Refine title: Stop at first major break to avoid leaking story content
            let title = match[3].trim().split(/\s{2,}|\n|\r/)[0];
            const content = text.substring(start, end).trim();

            if (type === "PART") {
                currentPart = number;
            }

            allMatches.push({
                type,
                number,
                title: match[0].trim().replace(/^#\s+/i, ""),
                content,
                start: match.index || 0,
                partContext: type === "PART" ? "global" : currentPart
            });
        }

        // Deduplicate: Key includes partContext to prevent merging same-numbered chapters in different parts
        const uniqueChapters: { [key: string]: typeof allMatches[0] } = {};
        allMatches.forEach(m => {
            const key = `${m.partContext}-${m.type}-${m.number}`;
            if (!uniqueChapters[key] || m.content.length > uniqueChapters[key].content.length) {
                uniqueChapters[key] = m;
            }
        });

        const sorted = Object.values(uniqueChapters).sort((a, b) => a.start - b.start);

        const finalChapters = sorted.map(c => ({ title: c.title, content: c.content }));
        if (introduction) {
            finalChapters.unshift({ title: "Introduction", content: introduction });
        }

        return finalChapters;
    };

    const create = async (type: "short" | "novel", importedContent: { title: string, content?: string, chapters?: { title: string, content: string }[] } | null = null) => {
        const user = auth.currentUser;
        if (!user) return;

        console.log("Starting draft creation...");
        const ref = collection(db, "users", user.uid, "drafts");

        const docRef = await addDoc(ref, {
            title: importedContent?.title || "",
            content: type === "short" ? (importedContent?.content || "") : "",
            genre: "Fantasy",
            coverImage: "",
            type,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        if (type === "novel" && importedContent?.chapters) {
            console.log(`Importing ${importedContent.chapters.length} chapters...`);
            const chapRef = collection(db, "users", user.uid, "drafts", docRef.id, "chapters");

            // Parallel create chapters for speed
            await Promise.all(importedContent.chapters.map((chap, i) =>
                addDoc(chapRef, {
                    title: chap.title,
                    content: chap.content,
                    order: i,
                    updatedAt: serverTimestamp(),
                })
            ));

            alert("Import Complete! All chapters have been synchronized.");
        }

        router.push(`/creator/dashboard/drafts/${docRef.id}`);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const title = sanitizeTitle(file.name.replace(/\.[^/.]+$/, ""));
        let rawText = "";

        if (file.type === "application/pdf") {
            try {
                if (!(window as any).pdfjsLib) {
                    const script = document.createElement('script');
                    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
                    document.head.appendChild(script);
                    await new Promise((resolve) => { script.onload = resolve; });
                }
                const pdfjsLib = (window as any).pdfjsLib;
                pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();

                    // Group items by Y coordinate to reconstruct lines
                    const lines: { [y: number]: any[] } = {};
                    textContent.items.forEach((item: any) => {
                        const y = Math.round(item.transform[5]);
                        if (!lines[y]) lines[y] = [];
                        lines[y].push(item);
                    });

                    // Sort lines by Y (descending for top-to-bottom)
                    const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a);

                    sortedY.forEach(y => {
                        // Sort items within line by X
                        const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
                        rawText += lineItems.map((item: any) => item.str).join(" ") + "\n";
                    });
                    rawText += "\n"; // Page break
                }
                console.log("Reconstructed rawText length:", rawText.length);
            } catch (err) {
                console.error("PDF load failed:", err);
                alert("PDF load failed.");
                return;
            }
        } else {
            rawText = await file.text();
        }

        if (!rawText.trim()) {
            alert("No text found in file.");
            return;
        }

        const detectedChapters = detectChapters(rawText);

        if (detectedChapters.length > 1) {
            if (confirm(`Detected ${detectedChapters.length} chapters. Import as a Novel?`)) {
                await create("novel", { title, chapters: detectedChapters });
            } else {
                await create("short", { title, content: rawText });
            }
        } else {
            await create("short", { title, content: rawText });
        }
    };

    return (
        <section className="space-y-12 max-w-2xl mx-auto pt-16 transition-all duration-500">
            <header className="space-y-2 text-center mb-12">
                <h1 className="text-4xl tracking-[0.3em] font-light uppercase text-[var(--foreground)]">Start a New Draft</h1>
                <p className="text-[var(--reader-text)]/40 text-[10px] uppercase tracking-[0.2em]">Select the architecture for your next chronicle</p>
            </header>

            <div className="space-y-6">
                <button
                    onClick={() => create("short")}
                    className="w-full glass-panel p-10 text-left group hover:bg-white/[0.03] hover:border-white/10 transition-all rounded-3xl border-white/5 active:scale-[0.98]"
                >
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-light text-[var(--foreground)] group-hover:text-[var(--accent-sakura)] transition-colors">Short Story</span>
                        <div className="h-2 w-2 rounded-full bg-[var(--accent-sakura)]/20 group-hover:bg-[var(--accent-sakura)] transition-all shadow-[0_0_10px_var(--accent-sakura)]" />
                    </div>
                    <span className="text-sm text-[var(--reader-text)]/60 leading-relaxed font-light italic">A single piece of work, published as one entity. Perfect for stand-alone legends.</span>
                </button>

                <button
                    onClick={() => create("novel")}
                    className="w-full glass-panel p-10 text-left group hover:bg-white/[0.03] hover:border-white/10 transition-all rounded-3xl border-white/5 active:scale-[0.98]"
                >
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-light text-[var(--foreground)] group-hover:text-[var(--accent-lime)] transition-colors">Novel Schema</span>
                        <div className="h-2 w-2 rounded-full bg-[var(--accent-lime)]/20 group-hover:bg-[var(--accent-lime)] transition-all shadow-[0_0_10px_var(--glow-lime)]" />
                    </div>
                    <span className="text-sm text-[var(--reader-text)]/60 leading-relaxed font-light italic">A multi-chapter work with structured organization. For the architects of epics.</span>
                </button>

                <div className="relative w-full glass-panel p-10 text-left group hover:bg-white/[0.03] hover:border-white/10 transition-all rounded-3xl border-white/5 border-dashed active:scale-[0.98]">
                    <input
                        type="file"
                        accept=".txt,.md,.pdf"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-light text-[var(--foreground)] group-hover:text-white transition-colors flex items-center gap-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--reader-text)]/30 group-hover:text-white transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            Import from File
                        </span>
                        <div className="h-2 w-2 rounded-full bg-white/5 group-hover:bg-white transition-all shadow-[0_0_10px_white]" />
                    </div>
                    <span className="text-sm text-[var(--reader-text)]/60 leading-relaxed font-light italic">Upload a .txt, .md, or .pdf file. Our system will attempt to detect and structure your chapters automatically.</span>
                </div>
            </div>

            <footer className="pt-12 text-[10px] uppercase tracking-[0.5em] text-white/5 border-t border-white/5 flex justify-center items-center">
                <span className="italic">Choose your path in the Archives</span>
            </footer>
        </section>
    );
}
