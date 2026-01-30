import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notFound } from "next/navigation";

// Define PageProps explicitly for Next.js 13+ App Router
// Define PageProps explicitly for Next.js 13+ App Router
type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function StoryPage({ params }: PageProps) {
    const { id } = await params;
    const ref = doc(db, "stories", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        return notFound();
    }

    const story = snap.data();

    // Ensure story is published before showing it
    if (!story.published) {
        return notFound();
    }

    return (
        <main className="min-h-screen bg-black text-gray-200 px-6 py-16">
            <article className="max-w-2xl mx-auto space-y-8">
                <header className="space-y-2 border-b border-white/5 pb-8">
                    <h1 className="text-3xl font-light tracking-wide text-white">
                        {story.title}
                    </h1>

                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <p>by <span className="text-gray-300">{story.authorName ?? "Unknown Author"}</span></p>
                        <p>{story.genre ?? "Story"}</p>
                    </div>
                </header>

                <div className="prose prose-invert max-w-none leading-relaxed text-gray-300 font-serif">
                    {story.content.split("\n").map((line: string, i: number) => (
                        <p key={i} className="mb-4">{line}</p>
                    ))}
                </div>
            </article>
        </main>
    );
}
