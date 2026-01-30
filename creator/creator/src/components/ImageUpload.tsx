"use client";

import { useState } from "react";

interface ImageUploadProps {
    onUploadComplete: (url: string) => void;
    label?: string;
    className?: string;
}

export default function ImageUpload({ onUploadComplete, label = "Upload Image", className = "" }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setError(null);
        setUploading(true);

        const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
        if (!apiKey) {
            setError("ImgBB API Key is missing. Please add NEXT_PUBLIC_IMGBB_API_KEY to your .env file.");
            setUploading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                onUploadComplete(result.data.url);
            } else {
                throw new Error(result.error?.message || "Upload failed");
            }
        } catch (err: any) {
            console.error("ImgBB Upload Error:", err);
            setError(err.message || "Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {label && <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</label>}

            <div className="relative group border border-white/10 bg-black hover:border-white/30 transition-colors rounded-sm overflow-hidden aspect-[4/5] max-w-[200px] flex items-center justify-center">
                {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <div className="text-gray-600 group-hover:text-gray-400 text-center p-4">
                        <span className="block text-2xl mb-1">+</span>
                        <span className="text-[10px] uppercase tracking-tighter">Choose File</span>
                    </div>
                )}

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                />

                {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {error && <p className="text-[10px] text-red-500 uppercase tracking-wide">{error}</p>}
            {uploading && <p className="text-[10px] text-gray-500 uppercase tracking-widest animate-pulse">Uploading to chronicles...</p>}
        </div>
    );
}
