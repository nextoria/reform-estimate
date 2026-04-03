"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Lead {
  id: string;
  clientId: string;
  name: string | null;
  phone: string | null;
  lineUserId: string | null;
  buildingAge: number | null;
  concerns: string | null;
  photos: string | null;
  details: string | null;
  estimate: string | null;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "新規",
  contacted: "連絡済",
  surveyed: "調査済",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  surveyed: "bg-green-100 text-green-800",
};

export default function AdminPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const fetchLeads = async () => {
    const url = filter ? `/api/admin/leads?clientId=${filter}` : "/api/admin/leads";
    const res = await fetch(url);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchLeads();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white py-4 px-6 flex items-center justify-between">
        <h1 className="text-lg font-bold">管理画面 - リフォーム概算見積</h1>
        <nav className="flex gap-4 text-sm items-center">
          <Link href="/admin" className="underline">
            案件一覧
          </Link>
          <Link href="/admin/rules" className="hover:underline opacity-80 hover:opacity-100">
            見積ルール
          </Link>
          <Link href="/admin/clients" className="hover:underline opacity-80 hover:opacity-100">
            クライアント
          </Link>
          <button
            onClick={handleLogout}
            className="ml-4 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
          >
            ログアウト
          </button>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">全クライアント</option>
            <option value="client-a">サンプルリフォーム株式会社</option>
            <option value="client-b">快適住まいリフォーム</option>
          </select>
          <span className="text-sm text-gray-500">{leads.length}件</span>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">読み込み中...</p>
        ) : leads.length === 0 ? (
          <p className="text-center text-gray-500 py-8">案件がありません</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">日時</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">クライアント</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">名前</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">電話</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">LINE</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">築年数</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">困りごと</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">詳細要望</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">概算金額</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-4 py-3">{lead.clientId}</td>
                    <td className="px-4 py-3">{lead.name ?? "-"}</td>
                    <td className="px-4 py-3">{lead.phone ?? "-"}</td>
                    <td className="px-4 py-3">
                      {lead.lineUserId ? (
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">連携</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{lead.buildingAge ?? "-"}年</td>
                    <td className="px-4 py-3">{lead.concerns ?? "-"}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      {lead.details ? (
                        <span className="block truncate" title={lead.details}>{lead.details}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(() => {
                        if (!lead.estimate) return "-";
                        try {
                          const est = JSON.parse(lead.estimate);
                          return `${(est.totalMin / 10000).toFixed(0)}〜${(est.totalMax / 10000).toFixed(0)}万円`;
                        } catch {
                          return "-";
                        }
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[lead.status] ?? ""}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
