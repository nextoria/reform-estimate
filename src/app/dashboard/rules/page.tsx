"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EstimateRule {
  id: string;
  clientId: string;
  category: string;
  itemKey: string;
  itemLabel: string;
  unitType: string;
  baseMinPrice: number;
  baseMaxPrice: number;
  lightMultiplier: number;
  mediumMultiplier: number;
  heavyMultiplier: number;
  repairMultiplier: number;
  partialMultiplier: number;
  fullMultiplier: number;
  isActive: boolean;
}

export default function DashboardRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<EstimateRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/rules")
      .then((res) => res.json())
      .then((data) => setRules(data.rules ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white py-4 px-6 flex items-center justify-between">
        <h1 className="text-lg font-bold">見積ルール</h1>
        <nav className="flex gap-4 text-sm items-center">
          <Link href="/dashboard" className="hover:underline opacity-80 hover:opacity-100">
            案件一覧
          </Link>
          <Link href="/dashboard/rules" className="underline">
            見積ルール
          </Link>
          <button
            onClick={handleLogout}
            className="ml-4 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
          >
            ログアウト
          </button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">自社の見積ルール</h2>

        {loading ? (
          <p className="text-center text-gray-500 py-8">読み込み中...</p>
        ) : rules.length === 0 ? (
          <p className="text-center text-gray-500 py-8">ルールがありません</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">カテゴリ</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">表示名</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">単位</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">最低価格</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">最高価格</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">軽度</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">中度</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">重度</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">補修</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">部分</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">全面</th>
                  <th className="text-center px-3 py-2 font-medium text-gray-600">有効</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{rule.category}</td>
                    <td className="px-3 py-2">{rule.itemLabel}</td>
                    <td className="px-3 py-2 text-gray-500">{rule.unitType}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {rule.baseMinPrice.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {rule.baseMaxPrice.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{rule.lightMultiplier}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{rule.mediumMultiplier}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{rule.heavyMultiplier}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{rule.repairMultiplier}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{rule.partialMultiplier}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{rule.fullMultiplier}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          rule.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
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
