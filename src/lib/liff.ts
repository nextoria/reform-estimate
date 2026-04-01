"use client";

import liff from "@line/liff";

let initialized = false;

export async function initLiff(): Promise<string | null> {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) return null;

  try {
    if (!initialized) {
      await liff.init({ liffId });
      initialized = true;
    }

    if (!liff.isLoggedIn()) {
      // LINE内ブラウザなら自動ログイン、外部ブラウザならnull返却
      if (liff.isInClient()) {
        liff.login();
        return null; // リダイレクト後に再取得
      }
      return null;
    }

    const profile = await liff.getProfile();
    return profile.userId;
  } catch (e) {
    console.error("LIFF init error:", e);
    return null;
  }
}

export function isInLineClient(): boolean {
  if (!initialized) return false;
  return liff.isInClient();
}

export function isLiffReady(): boolean {
  return initialized;
}
