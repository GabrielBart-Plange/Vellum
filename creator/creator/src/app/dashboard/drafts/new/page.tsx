"use client";

import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function NewDraftPage() {
    const router = useRouter();

    const create = async (type: "short" | "novel") => {
        const user = auth.currentUser;
        if (!user) return;

        const ref = collection(db, "users", user.uid, "drafts");

        const doc = await addDoc(ref, {
            title: "",
            content: "",
            genre: "Fantasy",
            coverImage: "",
            type,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        router.push(`/dashboard/drafts/${doc.id}`);
    };

    return (
        <section className="space-y-4">
            <h1 className="tracking-widest">New Draft</h1>

            <button
                onClick={() => create("short")}
                className="border px-4 py-2 block"
            >
                Short Story
            </button>

            <button
                onClick={() => create("novel")}
                className="border px-4 py-2 block"
            >
                Novel 
            </button>
        </section>
    );
}
