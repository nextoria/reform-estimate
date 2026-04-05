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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [clientKey, setClientKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchClients = async () => {
    const res = await fetch("/api/admin/clients");
    const data = await res.json();
    setClients(data.clients ?? []);
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
      fetchClients();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setEditCompanyName(client.companyName);
    setEditContactEmail(client.contactEmail ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setUpdating(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: editCompanyName,
          contactEmail: editContactEmail || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "更新に失敗しました");
        return;
      }
      setMessage("更新しました");
      setEditingId(null);
      fetchClients();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setUpdating(false);
    }
  };

  const toggleActive = async (client: Client) => {
    setUpdating(true);
    setError("");
    setMessage("");
    const newActive = !client.isActive;
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "更新に失敗しました");
        return;
      }
      setMessage(newActive ? "有効化しました" : "停止しました");
      fetchClients();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setUpdating(false);
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
                  <th className="text-center px-4 py-3 font-medium text-gray-600">ステータス</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">作成日</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className={`border-b hover:bg-gray-50 ${!client.isActive ? "opacity-60" : ""}`}>
                    {editingId === client.id ? (
                      <>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={editCompanyName}
                            onChange={(e) => setEditCompanyName(e.target.value)}
                            className="w-full border border-blue-400 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{client.clientKey}</td>
                        <td className="px-2 py-2">
                          <input
                            type="email"
                            value={editContactEmail}
                            onChange={(e) => setEditContactEmail(e.target.value)}
                            className="w-full border border-blue-400 rounded px-2 py-1 text-sm"
                            placeholder="任意"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            client.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {client.isActive ? "有効" : "停止中"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(client.createdAt).toLocaleDateString("ja-JP")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(client.id)}
                              disabled={updating}
                              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 transition"
                            >
                              保存
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                            >
                              取消
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">{client.companyName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{client.clientKey}</td>
                        <td className="px-4 py-3">{client.contactEmail ?? "-"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            client.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {client.isActive ? "有効" : "停止中"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(client.createdAt).toLocaleDateString("ja-JP")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(client)}
                              className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => toggleActive(client)}
                              disabled={updating}
                              className={`text-xs px-3 py-1 rounded transition disabled:opacity-50 ${
                                client.isActive
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-green-100 text-green-700 hover:bg-green-200"
                              }`}
                            >
                              {client.isActive ? "停止" : "有効化"}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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
