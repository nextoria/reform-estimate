"use client";

import { useRef, useState } from "react";

interface PhotoUploadProps {
  maxPhotos?: number;
  onPhotosChange: (files: File[]) => void;
}

export default function PhotoUpload({ maxPhotos = 3, onPhotosChange }: PhotoUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    const updated = [...files, ...newFiles].slice(0, maxPhotos);
    setFiles(updated);
    onPhotosChange(updated);

    const newPreviews = updated.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return newPreviews;
    });

    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onPhotosChange(updated);
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        写真をアップロード（最大{maxPhotos}枚）
      </label>
      <div className="flex gap-3 flex-wrap">
        {previews.map((src, i) => (
          <div key={i} className="relative w-24 h-24">
            <img src={src} alt={`写真${i + 1}`} className="w-full h-full object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center"
            >
              x
            </button>
          </div>
        ))}
        {files.length < maxPhotos && (
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition">
            <span className="text-2xl text-gray-400">+</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleAdd}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}
