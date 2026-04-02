"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhotoUpload from "./PhotoUpload";

const CONCERNS = [
  { id: "roof", label: "屋根" },
  { id: "wall", label: "外壁" },
  { id: "water", label: "水回り" },
  { id: "floor", label: "床・フローリング" },
  { id: "bath", label: "浴室" },
  { id: "kitchen", label: "キッチン" },
  { id: "toilet", label: "トイレ" },
  { id: "other", label: "その他" },
];

interface EstimateFormProps {
  clientId: string;
  primaryColor: string;
  lineUserId?: string | null;
}

export default function EstimateForm({ clientId, primaryColor, lineUserId }: EstimateFormProps) {
  const router = useRouter();
  const [buildingAge, setBuildingAge] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleConcern = (id: string) => {
    setConcerns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingAge || concerns.length === 0) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("clientId", clientId);
      formData.set("buildingAge", buildingAge);
      formData.set("concerns", concerns.join(","));
      if (details) formData.set("details", details);
      if (lineUserId) formData.set("lineUserId", lineUserId);
      photos.forEach((p, i) => formData.set(`photo${i}`, p));

      const res = await fetch("/api/estimate", { method: "POST", body: formData });
      const data = await res.json();

      if (data.id) {
        const params = new URLSearchParams({
          leadId: data.id,
          estimate: JSON.stringify(data.estimate),
          ...(data.lineNotified ? { lineNotified: "true" } : {}),
        });
        router.push(`/c/${clientId}/result?${params.toString()}`);
      }
    } catch {
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PhotoUpload onPhotosChange={setPhotos} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          築年数
        </label>
        <select
          value={buildingAge}
          onChange={(e) => setBuildingAge(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
          required
        >
          <option value="">選択してください</option>
          <option value="5">5年以下</option>
          <option value="10">6〜10年</option>
          <option value="15">11〜15年</option>
          <option value="20">16〜20年</option>
          <option value="25">21〜25年</option>
          <option value="30">26〜30年</option>
          <option value="35">31〜35年</option>
          <option value="40">36年以上</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          お困りの箇所（複数選択可）
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CONCERNS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleConcern(c.id)}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition ${
                concerns.includes(c.id)
                  ? "text-white border-transparent"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
              style={
                concerns.includes(c.id) ? { backgroundColor: primaryColor } : undefined
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          詳細なご要望（任意）
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="どんな工事をしたいか、気になっている点、希望の仕上がりなどをご記入ください"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base resize-y min-h-[100px]"
          rows={4}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !buildingAge || concerns.length === 0}
        className="w-full text-white font-bold py-4 rounded-lg text-lg transition disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? "見積中..." : "無料で概算見積を見る"}
      </button>
    </form>
  );
}
