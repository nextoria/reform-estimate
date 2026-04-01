import type { EstimateResult } from "@/lib/estimate";

interface LineNotifyParams {
  lineUserId: string;
  clientName: string;
  estimate: EstimateResult;
  clientPhone: string;
}

function formatPrice(n: number): string {
  return (n / 10000).toFixed(0);
}

export async function sendEstimateNotification({
  lineUserId,
  clientName,
  estimate,
  clientPhone,
}: LineNotifyParams): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !lineUserId) return false;

  const itemLines = estimate.items
    .map((item) => `  ${item.label}: ${formatPrice(item.min)}〜${formatPrice(item.max)}万円`)
    .join("\n");

  const message = {
    type: "flex" as const,
    altText: `【${clientName}】概算見積結果: ${formatPrice(estimate.totalMin)}〜${formatPrice(estimate.totalMax)}万円`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: clientName,
            weight: "bold",
            size: "sm",
            color: "#999999",
          },
          {
            type: "text",
            text: "概算見積結果",
            weight: "bold",
            size: "xl",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: estimate.items.map((item) => ({
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: item.label,
                  size: "sm",
                  color: "#555555",
                  flex: 3,
                },
                {
                  type: "text",
                  text: `${formatPrice(item.min)}〜${formatPrice(item.max)}万円`,
                  size: "sm",
                  color: "#111111",
                  align: "end",
                  flex: 3,
                },
              ],
            })),
          },
          { type: "separator" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "概算合計",
                size: "md",
                weight: "bold",
                color: "#555555",
                flex: 2,
              },
              {
                type: "text",
                text: `${formatPrice(estimate.totalMin)}〜${formatPrice(estimate.totalMax)}万円`,
                size: "lg",
                weight: "bold",
                color: "#E63946",
                align: "end",
                flex: 3,
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: `劣化: ${estimate.degradationLevel}`,
                size: "xs",
                color: "#AAAAAA",
              },
              {
                type: "text",
                text: `工事: ${estimate.workLevel}`,
                size: "xs",
                color: "#AAAAAA",
              },
            ],
          },
          {
            type: "text",
            text: "※概算です。正確な金額は現地調査後にご案内します。",
            size: "xxs",
            color: "#AAAAAA",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "現地調査を申し込む",
              uri: `tel:${clientPhone}`,
            },
            style: "primary",
            color: "#2563EB",
          },
          {
            type: "button",
            action: {
              type: "message",
              label: "LINEで相談する",
              text: "リフォームについて相談したい",
            },
            style: "secondary",
          },
        ],
      },
    },
  };

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [message],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("LINE push error:", res.status, err);
      return false;
    }

    return true;
  } catch (e) {
    console.error("LINE notify error:", e);
    return false;
  }
}
