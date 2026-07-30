"use client";

import { useEffect, useRef } from "react";

// 打ち合わせ中に「相手の画面と自分の画面で見えているものが違う」状態にならないよう、
// 開いたままでも一定間隔でサーバーから取り直す。
export const REFRESH_INTERVAL_MS = 10_000;

/**
 * マウント時に1回 refresh を呼び、そのあとも定期的に呼び直す。
 * - タブが裏にある間は呼ばない(無駄なリクエストと課金を避ける)
 * - タブに戻ってきた瞬間・ウィンドウにフォーカスが戻った瞬間に1回呼ぶ
 * - 前回の refresh が終わっていなければ重ねて呼ばない
 *
 * 注意: refresh の中身が変わっても取り直しはしない(初回取得はマウント時のみ)。
 * 対象が切り替わるときは呼び出し側を key で作り直すこと。
 */
export function useLiveRefresh(
  refresh: () => void | Promise<void>,
  enabled = true
) {
  // 毎レンダーで関数の実体が変わってもタイマーを張り直さずに済むよう ref 経由で呼ぶ
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  });

  useEffect(() => {
    if (!enabled) return;

    let running = false;
    // 初回だけは裏タブでも取りに行く(バックグラウンドで開かれた時に空表示にしないため)
    const run = async (force = false) => {
      if (running || (!force && document.visibilityState !== "visible")) return;
      running = true;
      try {
        await refreshRef.current();
      } finally {
        running = false;
      }
    };

    void run(true);

    const timer = setInterval(() => void run(), REFRESH_INTERVAL_MS);
    const onWake = () => void run();
    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, [enabled]);
}
