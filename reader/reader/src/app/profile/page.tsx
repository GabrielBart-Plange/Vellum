"use client";

import { auth, db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp, writeBatch, collection, query, where, getDocs } from "firebase/firestore";
import ImageUpload from "@/components/creator/ImageUpload";

export default function ProfilePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/settings");
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center text-zinc-700 font-black tracking-[0.5em] uppercase text-xs">
            Redirecting to Library Settings...
        </div>
    );
}
