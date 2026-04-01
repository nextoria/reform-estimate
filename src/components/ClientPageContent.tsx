"use client";

import { useEffect, useState } from "react";
import EstimateForm from "./EstimateForm";
import { initLiff } from "@/lib/liff";

interface ClientPageContentProps {
  clientId: string;
  clientName: string;
  primaryColor: string;
}

export default function ClientPageContent({
  clientId,
  clientName,
  primaryColor,
}: ClientPageContentProps) {
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [lineChecked, setLineChecked] = useState(false);

  useEffect(() => {
    initLiff().then((userId) => {
      setLineUserId(userId);
      setLineChecked(true);
    }).catch(() => {
      setLineChecked(true);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="text-white py-6 px-4 text-center"
        style={{ backgroundColor: primaryColor }}
      >
        <h1 className="text-xl font-bold">{clientName}</h1>
        <p className="text-sm mt-1 opacity-90">リフォーム概算見積</p>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">
            かんたん概算見積
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            写真と情報を入力するだけで、すぐに概算金額がわかります
          </p>

          {lineUserId && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-600 text-sm font-medium">LINE連携中</span>
              <span className="text-xs text-green-500">見積結果をLINEにお届けします</span>
            </div>
          )}

          <EstimateForm
            clientId={clientId}
            primaryColor={primaryColor}
            lineUserId={lineUserId}
          />
        </div>
      </main>
    </div>
  );
}
