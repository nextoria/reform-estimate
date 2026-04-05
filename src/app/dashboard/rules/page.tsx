"use client";

import { useEffect, useState, useMemo } from "react";
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

type EditableField =
  | "baseMinPrice"
  | "baseMaxPrice"
  | "lightMultiplier"
  | "mediumMultiplier"
  | "heavyMultiplier"
  | "repairMultiplier"
  | "partialMultiplier"
  | "fullMultiplier";

const EDITABLE_FIELDS: EditableField[] = [
  "baseMinPrice",
  "baseMaxPrice",
  "lightMultiplier",
  "mediumMultiplier",
  "heavyMultiplier",
  "repairMultiplier",
  "partialMultiplier",
  "fullMultiplier",
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

  // Inline edit: track draft values per rule id
  const [drafts, setDrafts] = useState<Record<string, Partial<Record<EditableField, string>>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchRules = () => {
    fetch("/api/dashboard/rules")
      .then((res) => res.json())
      .then((data) => {
        const fetched: EstimateRule[] = data.rules ?? [];
        setRules(fetched);
        // Initialize drafts from fetched data
        const init: Record<string, Partial<Record<EditableField, string>>> = {};
        for (const r of fetched) {
          init[r.id] = {};
          for (const f of EDITABLE_FIELDS) {
            init[r.id][f] = String(r[f]);
          }
        }
        setDrafts(init);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const updateDraft = (ruleId: string, field: EditableField, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [ruleId]: { ...prev[ruleId], [field]: value },
    }));
  };

  const isDirty = (rule: EstimateRule): boolean => {
    const draft = drafts[rule.id];
    if (!draft) return false;
    return EDITABLE_FIELDS.some((f) => draft[f] !== String(rule[f]));
  };

  const saveRule = async (rule: EstimateRule) => {
    const draft = drafts[rule.id];
    if (!draft) return;

    const changes: Record<string, number> = {};
    for (const f of EDITABLE_FIELDS) {
      if (draft[f] !== String(rule[f])) {
        changes[f] = f.startsWith("base") ? parseInt(draft[f]!) : parseFloat(draft[f]!);
      }
    }

    if (Object.keys(changes).length === 0) return;

    setSavingId(rule.id);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/dashboard/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      setMessage(`「${rule.itemLabel}」を更新しました`);
      // Update the rule in-place
      setRules((prev) => prev.map((r) => (r.id === rule.id ? data.rule : r)));
      // Sync draft
      const updated: EstimateRule = data.rule;
      setDrafts((prev) => {
        const d: Partial<Record<EditableField, string>> = {};
        for (const f of EDITABLE_FIELDS) d[f] = String(updated[f]);
        return { ...prev, [rule.id]: d };
      });
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSavingId(null);
    }
  };

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

  // Simulation: compute estimate ranges from current drafts
  const SIM_ITEMS = [
    { key: "kitchen", label: "キッチン" },
    { key: "bath", label: "浴室" },
    { key: "wall", label: "外壁" },
    { key: "floor", label: "床・フローリング" },
  ];

  const simulation = useMemo(() => {
    return SIM_ITEMS.map(({ key, label }) => {
      const rule = rules.find((r) => r.itemKey === key);
      if (!rule) return { key, label, min: 0, max: 0, found: false };

      const draft = drafts[rule.id];
      const minPrice = parseFloat(draft?.baseMinPrice ?? String(rule.baseMinPrice)) || 0;
      const maxPrice = parseFloat(draft?.baseMaxPrice ?? String(rule.baseMaxPrice)) || 0;
      const medium = parseFloat(draft?.mediumMultiplier ?? String(rule.mediumMultiplier)) || 1;
      const partial = parseFloat(draft?.partialMultiplier ?? String(rule.partialMultiplier)) || 1;

      return {
        key,
        label,
        min: Math.round(minPrice * medium * partial / 10000) * 10000,
        max: Math.round(maxPrice * medium * partial / 10000) * 10000,
        found: true,
      };
    });
  }, [rules, drafts]);

  const simTotal = useMemo(() => ({
    min: simulation.reduce((s, i) => s + i.min, 0),
    max: simulation.reduce((s, i) => s + i.max, 0),
  }), [simulation]);

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

        {/* Simulation card */}
        {!loading && rules.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-1">想定見積シミュレーション</h2>
            <p className="text-xs text-gray-400 mb-4">中度劣化・部分交換を想定した概算金額</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {simulation.map((item) => (
                <div key={item.key} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  {item.found ? (
                    <p className="text-sm font-bold text-gray-800 tabular-nums">
                      {(item.min / 10000).toFixed(0)}〜{(item.max / 10000).toFixed(0)}
                      <span className="text-xs font-normal text-gray-500 ml-0.5">万円</span>
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">ルールなし</p>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">4項目 合計</span>
              <span className="text-base font-bold text-blue-800 tabular-nums">
                {(simTotal.min / 10000).toFixed(0)}〜{(simTotal.max / 10000).toFixed(0)}
                <span className="text-xs font-normal text-blue-600 ml-0.5">万円</span>
              </span>
            </div>
          </div>
        )}

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
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => {
                  const draft = drafts[rule.id] ?? {};
                  const dirty = isDirty(rule);
                  const isSaving = savingId === rule.id;
                  return (
                    <tr key={rule.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{rule.category}</td>
                      <td className="px-3 py-2">{rule.itemLabel}</td>
                      <td className="px-3 py-2 text-gray-500">{rule.unitType}</td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          step="10000"
                          value={draft.baseMinPrice ?? ""}
                          onChange={(e) => updateDraft(rule.id, "baseMinPrice", e.target.value)}
                          className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right tabular-nums focus:border-blue-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          step="10000"
                          value={draft.baseMaxPrice ?? ""}
                          onChange={(e) => updateDraft(rule.id, "baseMaxPrice", e.target.value)}
                          className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right tabular-nums focus:border-blue-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          step="0.01"
                          value={draft.lightMultiplier ?? ""}
                          onChange={(e) => updateDraft(rule.id, "lightMultiplier", e.target.value)}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right tabular-nums focus:border-blue-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          step="0.01"
                          value={draft.mediumMultiplier ?? ""}
                          onChange={(e) => updateDraft(rule.id, "mediumMultiplier", e.target.value)}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right tabular-nums focus:border-blue-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          step="0.01"
                          value={draft.heavyMultiplier ?? ""}
                          onChange={(e) => updateDraft(rule.id, "heavyMultiplier", e.target.value)}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right tabular-nums focus:border-blue-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          step="0.01"
                          value={draft.repairMultiplier ?? ""}
                          onChange={(e) => updateDraft(rule.id, "repairMultiplier", e.target.value)}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right tabular-nums focus:border-blue-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{rule.partialMultiplier}</td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          step="0.01"
                          value={draft.fullMultiplier ?? ""}
                          onChange={(e) => updateDraft(rule.id, "fullMultiplier", e.target.value)}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right tabular-nums focus:border-blue-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${
                            rule.isActive ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <button
                          onClick={() => saveRule(rule)}
                          disabled={!dirty || isSaving}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-30 transition whitespace-nowrap"
                        >
                          {isSaving ? "..." : "保存"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
