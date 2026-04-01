"use client";

import { useState } from "react";

interface LeadFormProps {
  leadId: string;
  primaryColor: string;
  onSubmitted: () => void;
}

export default function LeadForm({ leadId, primaryColor, onSubmitted }: LeadFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, name, phone }),
      });
      if (res.ok) {
        onSubmitted();
      }
    } catch {
      alert("保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        詳しい見積やご相談をご希望の方は、お名前とお電話番号をご入力ください。
      </p>
      <div>
        <input
          type="text"
          placeholder="お名前"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3"
          required
        />
      </div>
      <div>
        <input
          type="tel"
          placeholder="電話番号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading || !name || !phone}
        className="w-full text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? "送信中..." : "無料相談を申し込む"}
      </button>
    </form>
  );
}
