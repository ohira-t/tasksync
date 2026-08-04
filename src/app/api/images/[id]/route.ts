import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// スクリーンショットをアプリ経由で配信する認証付きプロキシ。
// blob の生URL(認証なしで誰でも見られる)をブラウザに渡さないための入り口で、
// Basic 認証(src/proxy.ts)を通過したリクエストだけがここに到達する。
// 将来 Private Blob へ移行する際も、このルートの取得処理を差し替えるだけでよい。

// SSRF対策: DBに保存されたURLのうち、ここに列挙したホストの画像だけを代理取得する。
// (課題更新APIは任意URLを受け付けるため、内部ネットワーク等へ向けた取得を防ぐ)
function isAllowedImageHost(hostname: string): boolean {
  if (hostname.endsWith(".blob.vercel-storage.com")) return true;
  // 開発環境ではデモ用の外部画像(picsum等)も許可する
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shot = await prisma.screenshot.findUnique({ where: { id } });
    if (!shot) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let url: URL;
    try {
      url = new URL(shot.url);
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (url.protocol !== "https:" || !isAllowedImageHost(url.hostname)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/octet-stream",
        // 認証付きコンテンツなので共有キャッシュには載せない
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}
