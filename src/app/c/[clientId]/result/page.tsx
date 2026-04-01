"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getClient } from "@/lib/clients";
import LeadForm from "@/components/LeadForm";

function formatPrice(n: number) {
  return n.toLocaleString("ja-JP");
}

export default function ResultPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId") ?? "";
  const estimateRaw = searchParams.get("estimate") ?? "{}";
  const lineNotified = searchParams.get("lineNotified") === "true";

  const client = getClient(clientId);
  const estimate = JSON.parse(estimateRaw) as {
    items: { label: string; category: string; unitType: string; min: number; max: number }[];
    totalMin: number;
    totalMax: number;
    degradationLevel: string;
    workLevel: string;
    note: string;
  };

  const [submitted, setSubmitted] = useState(false);

  if (!client) {
    return <div className="p-8 text-center">クライアントが見つかりません</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="text-white py-6 px-4 text-center"
        style={{ backgroundColor: client.primaryColor }}
      >
        <h1 className="text-xl font-bold">{client.name}</h1>
        <p className="text-sm mt-1 opacity-90">概算見積結果</p>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Estimate Result */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">概算見積</h2>
          {estimate.degradationLevel && (
            <div className="flex gap-2 mb-4">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                劣化判定: {estimate.degradationLevel}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                工事想定: {estimate.workLevel}
              </span>
            </div>
          )}
          <div className="space-y-3">
            {estimate.items?.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <span className="text-xs text-gray-400 ml-2">({item.category} / {item.unitType})</span>
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                  {formatPrice(item.min)}〜{formatPrice(item.max)}円
                </span>
              </div>
            ))}
          </div>
          <div
            className="mt-4 p-4 rounded-lg text-white text-center"
            style={{ backgroundColor: client.primaryColor }}
          >
            <p className="text-sm">概算合計</p>
            <p className="text-2xl font-bold mt-1">
              {formatPrice(estimate.totalMin)}〜{formatPrice(estimate.totalMax)}円
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-3">{estimate.note}</p>
          {lineNotified && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-600 text-sm">LINEにも見積結果を送信しました</span>
            </div>
          )}
        </div>

        {/* Lead Form or Thank You */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {submitted ? (
            <div className="text-center py-4">
              <p className="text-lg font-bold text-gray-800 mb-2">
                お申し込みありがとうございます
              </p>
              <p className="text-sm text-gray-600">
                担当者より折り返しご連絡いたします。
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                無料で詳しい見積を受け取る
              </h2>
              <LeadForm
                leadId={leadId}
                primaryColor={client.primaryColor}
                onSubmitted={() => setSubmitted(true)}
              />
            </>
          )}
        </div>

        {/* Contact Options */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            お問い合わせ
          </h2>
          <a
            href={`tel:${client.phone}`}
            className="block w-full text-center py-3 rounded-lg border-2 font-bold transition"
            style={{ borderColor: client.primaryColor, color: client.primaryColor }}
          >
            電話で相談 {client.phone}
          </a>
          {client.lineUrl && (
            <a
              href={client.lineUrl}
              className="block w-full text-center py-3 rounded-lg bg-[#06C755] text-white font-bold"
              target="_blank"
              rel="noopener noreferrer"
            >
              LINEで相談する
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
