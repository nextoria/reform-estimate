"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  clientKey: string;
  companyName: string;
  contactEmail: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [ruleClientIds, setRuleClientIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [clientKey, setClientKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [copyFrom, setCopyFrom] = useState("");

  const fetchClients = async () => {
    const res = await fetch("/api/admin/clients");
    const data = await res.json();
    setClients(data.clients ?? []);
    setRuleClientIds(data.ruleClientIds ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          clientKey,
          email,
          password,
          copyFromClientId: copyFrom || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "作成に失敗しました");
        return;
      }

      setMessage(`「${companyName}」を作成しました`);
      setCompanyName("");
      setClientKey("");
      setEmail("");
      setPassword("");
      setCopyFrom("");
      fetchClients();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white py-4 px-6 flex items-center justify-between">
        <h1 className="text-lg font-bold">クライアント管理</h1>
        <nav className="flex gap-4 text-sm items-center">
          <Link href="/admin" className="hover:underline opacity-80 hover:opacity-100">
            案件一覧
          </Link>
          <Link href="/admin/rules" className="hover:underline opacity-80 hover:opacity-100">
            見積ルール
          </Link>
          <Link href="/admin/clients" className="underline">
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
        {/* New client form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">新規クライアント追加</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会社名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="例: リフォーム太郎株式会社"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                クライアントキー <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clientKey}
                onChange={(e) => setClientKey(e.target.value)}
                required
                pattern="^[a-z0-9-]+$"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="例: client-c"
              />
              <p className="text-xs text-gray-400 mt-1">半角英数字とハイフンのみ</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ログイン用メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="例: info@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                初期パスワード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="8文字以上"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                見積ルールのコピー元
              </label>
              <select
                value={copyFrom}
                onChange={(e) => setCopyFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">コピーしない</option>
                {ruleClientIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                選択したクライアントの見積ルールをコピーして初期設定します
              </p>
            </div>

            {error && (
              <div className="sm:col-span-2">
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
              </div>
            )}

            {message && (
              <div className="sm:col-span-2">
                <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2">{message}</p>
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-gray-900 text-white rounded-lg px-6 py-2 font-medium hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {submitting ? "作成中..." : "クライアントを作成"}
              </button>
            </div>
          </form>
        </div>

        {/* Client list */}
        <h2 className="text-lg font-semibold mb-4">クライアント一覧</h2>

        {loading ? (
          <p className="text-center text-gray-500 py-8">読み込み中...</p>
        ) : clients.length === 0 ? (
          <p className="text-center text-gray-500 py-8">クライアントがありません</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">会社名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">キー</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">メール</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">有効</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">作成日</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{client.companyName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{client.clientKey}</td>
                    <td className="px-4 py-3">{client.contactEmail ?? "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          client.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(client.createdAt).toLocaleDateString("ja-JP")}
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
