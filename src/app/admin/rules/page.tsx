"use client";

import { useEffect, useState, useCallback } from "react";
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

type EditableField = keyof Pick<
  EstimateRule,
  | "itemLabel"
  | "baseMinPrice"
  | "baseMaxPrice"
  | "lightMultiplier"
  | "mediumMultiplier"
  | "heavyMultiplier"
  | "repairMultiplier"
  | "partialMultiplier"
  | "fullMultiplier"
  | "isActive"
>;

export default function RulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<EstimateRule[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const fetchRules = useCallback(async () => {
    const url = filter ? `/api/admin/rules?clientId=${filter}` : "/api/admin/rules";
    const res = await fetch(url);
    const data = await res.json();
    setRules(data.rules ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const updateRule = async (id: string, field: EditableField, value: string | number | boolean) => {
    setSaving(id);
    try {
      let parsed: string | number | boolean = value;
      if (field === "baseMinPrice" || field === "baseMaxPrice") {
        parsed = parseInt(String(value)) || 0;
      } else if (field.endsWith("Multiplier")) {
        parsed = parseFloat(String(value)) || 0;
      }

      const res = await fetch(`/api/admin/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: parsed }),
      });

      if (res.ok) {
        const data = await res.json();
        setRules((prev) => prev.map((r) => (r.id === id ? data.rule : r)));
      }
    } finally {
      setSaving(null);
    }
  };

  const NumberCell = ({
    rule,
    field,
    isPrice,
  }: {
    rule: EstimateRule;
    field: EditableField;
    isPrice?: boolean;
  }) => {
    const raw = rule[field] as number;
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(String(raw));

    if (!editing) {
      return (
        <td
          className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition text-right tabular-nums"
          onClick={() => {
            setVal(String(raw));
            setEditing(true);
          }}
        >
          {isPrice ? raw.toLocaleString() : raw}
        </td>
      );
    }

    return (
      <td className="px-1 py-1">
        <input
          type="number"
          step={isPrice ? "10000" : "0.01"}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => {
            updateRule(rule.id, field, val);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateRule(rule.id, field, val);
              setEditing(false);
            }
            if (e.key === "Escape") setEditing(false);
          }}
          autoFocus
          className="w-full border border-blue-400 rounded px-2 py-1 text-sm text-right"
        />
      </td>
    );
  };

  const LabelCell = ({ rule }: { rule: EstimateRule }) => {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(rule.itemLabel);

    if (!editing) {
      return (
        <td
          className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition"
          onClick={() => {
            setVal(rule.itemLabel);
            setEditing(true);
          }}
        >
          {rule.itemLabel}
        </td>
      );
    }

    return (
      <td className="px-1 py-1">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => {
            updateRule(rule.id, "itemLabel", val);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateRule(rule.id, "itemLabel", val);
              setEditing(false);
            }
            if (e.key === "Escape") setEditing(false);
          }}
          autoFocus
          className="w-full border border-blue-400 rounded px-2 py-1 text-sm"
        />
      </td>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white py-4 px-6 flex items-center justify-between">
        <h1 className="text-lg font-bold">見積ルール管理</h1>
        <nav className="flex gap-4 text-sm items-center">
          <Link href="/admin" className="hover:underline opacity-80 hover:opacity-100">
            案件一覧
          </Link>
          <Link href="/admin/rules" className="underline">
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">全クライアント</option>
            <option value="client-a">client-a</option>
            <option value="client-b">client-b</option>
          </select>
          <span className="text-sm text-gray-500">{rules.length}件</span>
          {saving && (
            <span className="text-sm text-blue-600">保存中...</span>
          )}
        </div>

        <p className="text-xs text-gray-400 mb-3">
          セルをクリックして編集 / Enter で保存 / Esc でキャンセル
        </p>

        {loading ? (
          <p className="text-center text-gray-500 py-8">読み込み中...</p>
        ) : rules.length === 0 ? (
          <p className="text-center text-gray-500 py-8">ルールがありません</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Client</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">カテゴリ</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Key</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">表示名</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">単位</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">最低価格</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">最高価格</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500" title="軽度劣化">軽度</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500" title="中度劣化">中度</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500" title="重度劣化">重度</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500" title="補修">補修</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500" title="部分交換">部分</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500" title="全面交換">全面</th>
                  <th className="text-center px-3 py-2 font-medium text-gray-600">有効</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{rule.clientId}</td>
                    <td className="px-3 py-2">{rule.category}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{rule.itemKey}</td>
                    <LabelCell rule={rule} />
                    <td className="px-3 py-2 text-gray-500">{rule.unitType}</td>
                    <NumberCell rule={rule} field="baseMinPrice" isPrice />
                    <NumberCell rule={rule} field="baseMaxPrice" isPrice />
                    <NumberCell rule={rule} field="lightMultiplier" />
                    <NumberCell rule={rule} field="mediumMultiplier" />
                    <NumberCell rule={rule} field="heavyMultiplier" />
                    <NumberCell rule={rule} field="repairMultiplier" />
                    <NumberCell rule={rule} field="partialMultiplier" />
                    <NumberCell rule={rule} field="fullMultiplier" />
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => updateRule(rule.id, "isActive", !rule.isActive)}
                        className={`w-10 h-5 rounded-full relative transition ${
                          rule.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            rule.isActive ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
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
