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

const TEMPLATES = [
  { id: "template-standard", label: "標準", description: "標準的な価格設定" },
  { id: "template-high", label: "高価格", description: "標準より+20%の価格設定" },
  { id: "template-low", label: "低価格", description: "標準より-20%の価格設定" },
];

export default function DashboardRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<EstimateRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [applying, setApplying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchRules = () => {
    fetch("/api/dashboard/rules")
      .then((res) => res.json())
      .then((data) => setRules(data.rules ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleApply = () => {
    if (!selectedTemplate) return;
    setConfirming(true);
  };

  const confirmApply = async () => {
    setConfirming(false);
    setApplying(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/dashboard/rules/apply-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedTemplate }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "適用に失敗しました");
        return;
      }

      const tmpl = TEMPLATES.find((t) => t.id === selectedTemplate);
      setMessage(`「${tmpl?.label}」テンプレートを適用しました（${data.count}件）`);
      setSelectedTemplate("");
      fetchRules();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setApplying(false);
    }
  };

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
        {/* Template selector */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">テンプレートから一括適用</h2>
          <p className="text-sm text-gray-500 mb-4">
            テンプレートを選択すると、現在のルールが全て置き換わります
          </p>

          <div className="flex flex-wrap gap-3 mb-4">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition ${
                  selectedTemplate === tmpl.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                <span className="block">{tmpl.label}</span>
                <span className={`block text-xs mt-0.5 ${
                  selectedTemplate === tmpl.id ? "text-blue-100" : "text-gray-400"
                }`}>
                  {tmpl.description}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleApply}
            disabled={!selectedTemplate || applying}
            className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition"
          >
            {applying ? "適用中..." : "このテンプレートを適用"}
          </button>

          {message && (
            <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2 mt-3">
              {message}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 mt-3">
              {error}
            </p>
          )}
        </div>

        {/* Confirm dialog */}
        {confirming && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">確認</h3>
              <p className="text-sm text-gray-600 mb-4">
                現在の見積ルールが全て削除され、
                「{TEMPLATES.find((t) => t.id === selectedTemplate)?.label}」
                テンプレートに置き換わります。よろしいですか？
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirming(false)}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmApply}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
                >
                  適用する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rules table */}
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
